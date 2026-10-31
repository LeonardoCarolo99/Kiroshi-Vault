import type { Metadata } from "next";
import { HandTester } from "@/components/hand/HandTester";

export const metadata: Metadata = {
  title: "Hand Tester",
  description: "Simulate Cyberpunk TCG opening hands and mulligans.",
};

export default function HandTesterPage() {
  return <HandTester />;
}
