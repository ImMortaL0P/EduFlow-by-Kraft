import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/tests")({
  beforeLoad: () => {
    throw redirect({ to: "/app/m/tests" });
  },
  component: () => null,
});
