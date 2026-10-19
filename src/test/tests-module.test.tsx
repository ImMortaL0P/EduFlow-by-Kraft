import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, it, expect } from "vitest";
import { TestsModule } from "@/components/modules/TestsModule";
import { routeTree } from "@/routeTree.gen";

describe("TestsModule", () => {
  it("renders without crashing", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <TestsModule />
      </QueryClientProvider>
    );
    expect(screen.getByText("Tests & Mock Analytics")).toBeDefined();
  });

  it("matches routes for tests and aliases", () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: new QueryClient() },
    });

    const mTestsMatch = router.matchRoutes("/app/m/tests");
    expect(mTestsMatch.length).toBeGreaterThan(0);

    const testsMatch = router.matchRoutes("/app/tests");
    expect(testsMatch.length).toBeGreaterThan(0);

    const mockTestsMatch = router.matchRoutes("/app/mock-tests");
    expect(mockTestsMatch.length).toBeGreaterThan(0);
  });
});
