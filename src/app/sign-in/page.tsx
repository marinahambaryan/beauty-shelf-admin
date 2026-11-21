import type { Metadata } from "next";
import { signIn } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { Text } from "@/components/fields";

export const metadata: Metadata = { title: "Sign in" };

const PROBLEMS: Record<string, string> = {
  access: "This account doesn't have admin access.",
  setup: "The admin migration hasn't been applied to this database.",
};

export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { problem } = await searchParams;
  return (
    <main className="sign-in">
      <h1>Beauty Shelf admin</h1>
      {typeof problem === "string" && PROBLEMS[problem] && (
        <p className="message message-error">{PROBLEMS[problem]}</p>
      )}
      <ActionForm action={signIn} className="stack">
        <Text label="Email" name="email" type="email" autoComplete="email" required autoFocus />
        <Text label="Password" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton>Sign in</SubmitButton>
      </ActionForm>
    </main>
  );
}
