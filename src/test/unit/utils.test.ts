import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    const result = cn("bg-red-500", "text-white");
    expect(result).toBe("bg-red-500 text-white");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("handles false conditional classes", () => {
    const isActive = false;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class");
  });

  it("merges conflicting Tailwind classes correctly", () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("handles arrays of classes", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("handles undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("handles empty strings", () => {
    const result = cn("base", "", "end");
    expect(result).toBe("base end");
  });
});

describe("Date formatting utilities", () => {
  it("formats dates in French locale", () => {
    const date = new Date("2025-01-25");
    const formatted = date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(formatted).toContain("25");
    expect(formatted).toContain("2025");
  });

  it("handles ISO date strings", () => {
    const isoString = "2025-01-25T10:30:00.000Z";
    const date = new Date(isoString);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January is 0
    expect(date.getDate()).toBe(25);
  });
});

describe("Grade calculation utilities", () => {
  const calculateAverage = (grades: number[], coefficients?: number[]): number => {
    if (grades.length === 0) return 0;

    if (coefficients && coefficients.length === grades.length) {
      const totalWeighted = grades.reduce(
        (sum, grade, i) => sum + grade * coefficients[i],
        0
      );
      const totalCoef = coefficients.reduce((sum, coef) => sum + coef, 0);
      return totalCoef > 0 ? totalWeighted / totalCoef : 0;
    }

    return grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
  };

  it("calculates simple average correctly", () => {
    const result = calculateAverage([10, 12, 14, 16]);
    expect(result).toBe(13);
  });

  it("calculates weighted average correctly", () => {
    const grades = [10, 20];
    const coefficients = [1, 3];
    const result = calculateAverage(grades, coefficients);
    // (10*1 + 20*3) / (1+3) = 70/4 = 17.5
    expect(result).toBe(17.5);
  });

  it("returns 0 for empty array", () => {
    expect(calculateAverage([])).toBe(0);
  });

  it("handles single grade", () => {
    expect(calculateAverage([15])).toBe(15);
  });

  it("handles decimal grades", () => {
    const result = calculateAverage([15.5, 16.5]);
    expect(result).toBe(16);
  });
});

describe("String utilities", () => {
  const capitalizeFirst = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatFullName = (firstName: string, lastName: string): string => {
    return `${capitalizeFirst(firstName)} ${lastName.toUpperCase()}`;
  };

  it("capitalizes first letter correctly", () => {
    expect(capitalizeFirst("jean")).toBe("Jean");
    expect(capitalizeFirst("MARIE")).toBe("Marie");
    expect(capitalizeFirst("")).toBe("");
  });

  it("formats full name correctly", () => {
    expect(formatFullName("jean", "dupont")).toBe("Jean DUPONT");
    expect(formatFullName("MARIE", "martin")).toBe("Marie MARTIN");
  });
});

describe("Input sanitization", () => {
  const sanitizeInput = (input: string): string => {
    if (!input) return "";
    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .slice(0, 1000); // Limit length
  };

  it("trims whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("removes HTML-like characters", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
      "scriptalert('xss')/script"
    );
  });

  it("limits input length", () => {
    const longInput = "a".repeat(2000);
    expect(sanitizeInput(longInput).length).toBe(1000);
  });

  it("handles empty input", () => {
    expect(sanitizeInput("")).toBe("");
    expect(sanitizeInput(null as any)).toBe("");
  });
});
