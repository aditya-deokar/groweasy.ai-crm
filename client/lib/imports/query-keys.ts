export const importQueryKeys = {
  all: ["imports"] as const,
  detail(importId: string) {
    return [...this.all, importId] as const;
  },
  status(importId: string) {
    return [...this.detail(importId), "status"] as const;
  },
  result(importId: string, includeSkipped: boolean) {
    return [...this.detail(importId), "result", { includeSkipped }] as const;
  },
};
