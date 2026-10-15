"use client";

type Props = {
  name: string;
  size?: number;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const COLORS = [
  "#E01E5A",
  "#36C5F0",
  "#2EB67D",
  "#ECB22E",
  "#611F69",
  "#4A154B",
];

function colorFor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return COLORS[sum % COLORS.length];
}

export function SlackAvatar({ name, size = 36 }: Props) {
  const color = colorFor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        backgroundColor: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}