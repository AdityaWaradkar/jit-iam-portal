"use client";

import "@xterm/xterm/css/xterm.css";

import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import {
  runTerminalCommand,
  type IssueCredentialResponse,
} from "@/lib/api";

const COLORS = {
  prompt: "\x1b[38;2;120;220;150m",
  promptRole: "\x1b[38;2;160;200;255m",
  dim: "\x1b[38;2;130;130;140m",
  error: "\x1b[38;2;235;100;100m",
  system: "\x1b[38;2;200;180;120m",
  reset: "\x1b[0m",
};

const SUPPORTED = [
  "  aws sts get-caller-identity    Show the assumed role identity",
  "  aws s3 ls                      List sample buckets",
  "  whoami                         Show the current session name",
  "  env                            Show credential environment variables",
  "  help                           Show supported commands",
  "  clear                          Clear the screen (or Ctrl+L)",
];

type Props = {
  credentials: IssueCredentialResponse | null;
};

export function Terminal({ credentials }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTerm | null>(null);
  const credentialRef = useRef<IssueCredentialResponse | null>(null);
  const bufferRef = useRef<string>("");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  function promptString(): string {
    const cred = credentialRef.current;
    if (cred && cred.assumed_role_name) {
      return `${COLORS.prompt}jit${COLORS.reset}${COLORS.dim}:${COLORS.reset}${COLORS.promptRole}${cred.assumed_role_name}${COLORS.reset} ${COLORS.prompt}$${COLORS.reset} `;
    }
    return `${COLORS.prompt}$${COLORS.reset} `;
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      convertEol: true,
      theme: {
        background: "#0b0b0f",
        foreground: "#e6e6e6",
        cursor: "#e6e6e6",
        selectionBackground: "#2d3748",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;

    const writePrompt = () => term.write(promptString());

    function writeWithCRLF(text: string) {
      term.write(text.replace(/\n/g, "\r\n"));
    }

    async function execute(command: string) {
      const cred = credentialRef.current;
      if (!cred) {
        term.writeln(
          `${COLORS.error}No credentials loaded. Select an active lease and click "Use in terminal".${COLORS.reset}`,
        );
        writePrompt();
        return;
      }

      if (command === "clear") {
        term.clear();
        writePrompt();
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
          writeWithCRLF(response.stdout);
          if (!response.stdout.endsWith("\n")) term.write("\r\n");
        }
        if (response.stderr) {
          writeWithCRLF(`${COLORS.error}${response.stderr}${COLORS.reset}`);
          if (!response.stderr.endsWith("\n")) term.write("\r\n");
        }
      } catch (err) {
        term.writeln(
          `${COLORS.error}Terminal error: ${
            err instanceof Error ? err.message : "unknown"
          }${COLORS.reset}`,
        );
      }
      writePrompt();
    }

    function handleData(data: string) {
      if (data === "\x03") {
        // Ctrl+C
        term.write("^C\r\n");
        bufferRef.current = "";
        historyIndexRef.current = -1;
        writePrompt();
        return;
      }

      if (data === "\x0c") {
        // Ctrl+L
        term.clear();
        term.write(promptString());
        term.write(bufferRef.current);
        return;
      }

      if (data === "\r") {
        term.write("\r\n");
        const command = bufferRef.current.trim();
        bufferRef.current = "";
        historyIndexRef.current = -1;
        if (command) {
          historyRef.current.unshift(command);
          if (historyRef.current.length > 100) {
            historyRef.current.length = 100;
          }
          void execute(command);
        } else {
          writePrompt();
        }
        return;
      }

      if (data === "\x7f") {
        // Backspace
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }

      if (data === "\t") {
        // Tab -> four spaces
        bufferRef.current += "    ";
        term.write("    ");
        return;
      }

      if (data === "\x1b[A") {
        // Up arrow
        const next = historyIndexRef.current + 1;
        if (next < historyRef.current.length) {
          const cmd = historyRef.current[next];
          const eraseCount = bufferRef.current.length;
          if (eraseCount > 0) term.write("\b \b".repeat(eraseCount));
          term.write(cmd);
          bufferRef.current = cmd;
          historyIndexRef.current = next;
        }
        return;
      }

      if (data === "\x1b[B") {
        // Down arrow
        const next = historyIndexRef.current - 1;
        if (next >= 0) {
          const cmd = historyRef.current[next];
          const eraseCount = bufferRef.current.length;
          if (eraseCount > 0) term.write("\b \b".repeat(eraseCount));
          term.write(cmd);
          bufferRef.current = cmd;
          historyIndexRef.current = next;
        } else if (historyIndexRef.current !== -1) {
          const eraseCount = bufferRef.current.length;
          if (eraseCount > 0) term.write("\b \b".repeat(eraseCount));
          bufferRef.current = "";
          historyIndexRef.current = -1;
        }
        return;
      }

      if (data >= " " && data <= "~") {
        bufferRef.current += data;
        term.write(data);
      }
    }

    const dataDisposable = term.onData(handleData);

    // Welcome banner
    term.writeln("");
    term.writeln(
      `  ${COLORS.prompt}JIT IAM Portal${COLORS.reset} ${COLORS.dim}sandbox terminal${COLORS.reset}`,
    );
    term.writeln("");
    term.writeln(
      `  ${COLORS.dim}This terminal simulates AWS CLI commands against the credential you load from the leases list. The backend verifies the presented secret against the stored hash on every command.${COLORS.reset}`,
    );
    term.writeln("");
    term.writeln(`${COLORS.system}Supported commands:${COLORS.reset}`);
    for (const line of SUPPORTED) {
      term.writeln(`${COLORS.dim}${line}${COLORS.reset}`);
    }
    term.writeln("");
    term.writeln(
      `${COLORS.system}No credentials loaded.${COLORS.reset} ${COLORS.dim}Select an active lease and click "Use in terminal".${COLORS.reset}`,
    );
    term.writeln("");
    writePrompt();

    const handleResize = () => fit.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      dataDisposable.dispose();
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    credentialRef.current = credentials;
    const term = termRef.current;
    if (!term || !credentials) return;

    term.writeln("");
    term.writeln(
      `${COLORS.system}Credentials loaded.${COLORS.reset} ${COLORS.dim}Assuming${COLORS.reset} ${COLORS.promptRole}${credentials.assumed_role_name ?? "unknown"}${COLORS.reset}${COLORS.dim}.${COLORS.reset}`,
    );
    term.writeln(
      `${COLORS.dim}Access Key ID: ${credentials.access_key_id}${COLORS.reset}`,
    );
    term.writeln(`${COLORS.dim}Try: aws sts get-caller-identity${COLORS.reset}`);
    term.writeln("");
    term.write(promptString());
  }, [credentials]);

  return (
    <div
      ref={containerRef}
      className="h-96 w-full rounded-md border border-border bg-black p-2"
    />
  );
}