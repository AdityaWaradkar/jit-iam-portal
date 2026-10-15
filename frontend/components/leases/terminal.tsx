"use client";

import "@xterm/xterm/css/xterm.css";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import { useEffect, useRef } from "react";

import {
  runTerminalCommand,
  type IssueCredentialResponse,
} from "@/lib/api";

const PROMPT = "\x1b[32m$\x1b[0m ";

type Props = {
  credentials: IssueCredentialResponse | null;
};

export function Terminal({ credentials }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTerm | null>(null);
  const credentialRef = useRef<IssueCredentialResponse | null>(null);
  const bufferRef = useRef<string>("");

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: "#0b0b0f",
        foreground: "#e6e6e6",
      },
      convertEol: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;

    term.writeln("JIT IAM Portal sandbox terminal");
    term.writeln(
      "Issue a credential from the Requests page, then click 'Use in terminal' on a lease.",
    );
    term.writeln("");
    term.write(PROMPT);

    async function execute(command: string) {
      const cred = credentialRef.current;
      if (!cred) {
        term.writeln(
          "\x1b[31mNo credentials loaded. Issue one from the Requests page first.\x1b[0m",
        );
        term.write(PROMPT);
        return;
      }

      if (command === "clear") {
        term.clear();
        term.write(PROMPT);
        return;
      }

      try {
        const response = await runTerminalCommand({
          access_key_id: cred.access_key_id,
          secret_access_key: cred.secret_access_key,
          session_token: cred.session_token,
          command,
        });

        if (response.stdout) {
          term.writeln(response.stdout.replace(/\n/g, "\r\n"));
        }
        if (response.stderr) {
          term.writeln(
            `\x1b[31m${response.stderr.replace(/\n/g, "\r\n")}\x1b[0m`,
          );
        }
      } catch (err) {
        term.writeln(
          `\x1b[31mTerminal error: ${err instanceof Error ? err.message : "unknown"
          }\x1b[0m`,
        );
      }
      term.write(PROMPT);
    }

    const disposable = term.onData((data: string) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        term.write("\r\n");
        const command = bufferRef.current.trim();
        bufferRef.current = "";
        if (command) {
          void execute(command);
        } else {
          term.write(PROMPT);
        }
        return;
      }

      if (code === 127) {
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }

      if (code === 3) {
        term.write("^C\r\n");
        bufferRef.current = "";
        term.write(PROMPT);
        return;
      }

      if (code >= 32 && code < 127) {
        bufferRef.current += data;
        term.write(data);
      }
    });

    const handleResize = () => fit.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      disposable.dispose();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    credentialRef.current = credentials;
    const term = termRef.current;
    if (!term || !credentials) return;

    term.writeln("");
    term.writeln(
      `\x1b[36mCredentials loaded for ${credentials.assumed_role_name}.\x1b[0m`,
    );
    term.writeln(
      `\x1b[90mAccess Key ID: ${credentials.access_key_id}\x1b[0m`,
    );
    term.writeln(
      `\x1b[90mTry: aws sts get-caller-identity\x1b[0m`,
    );
    term.writeln("");
    term.write(PROMPT);
  }, [credentials]);

  async function execute(term: XTerm, command: string) {
    const cred = credentialRef.current;
    if (!cred) {
      term.writeln(
        "\x1b[31mNo credentials loaded. Issue one from the Requests page first.\x1b[0m",
      );
      term.write(PROMPT);
      return;
    }

    if (command === "clear") {
      term.clear();
      term.write(PROMPT);
      return;
    }

    try {
      const response = await runTerminalCommand({
        access_key_id: cred.access_key_id,
        secret_access_key: cred.secret_access_key,
        session_token: cred.session_token,
        command,
      });

      if (response.stdout) {
        term.writeln(response.stdout.replace(/\n/g, "\r\n"));
      }
      if (response.stderr) {
        term.writeln(
          `\x1b[31m${response.stderr.replace(/\n/g, "\r\n")}\x1b[0m`,
        );
      }
    } catch (err) {
      term.writeln(
        `\x1b[31mTerminal error: ${err instanceof Error ? err.message : "unknown"
        }\x1b[0m`,
      );
    }
    term.write(PROMPT);
  }

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-md border border-border bg-black p-2"
    />
  );
}