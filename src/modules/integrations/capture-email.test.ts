import { describe, expect, it } from "vitest";
import { isValidCaptureEmail } from "./capture";

describe("isValidCaptureEmail", () => {
  it("aceita endereço simples dentro dos limites", () => {
    expect(isValidCaptureEmail("pessoa@example.com")).toBe(true);
  });

  it("rejeita formatos sem usuário, domínio ou ponto de domínio", () => {
    expect(isValidCaptureEmail("@example.com")).toBe(false);
    expect(isValidCaptureEmail("pessoa@localhost")).toBe(false);
    expect(isValidCaptureEmail("pessoa@example.")).toBe(false);
    expect(isValidCaptureEmail("pessoa@@example.com")).toBe(false);
  });

  it("rejeita espaço em branco interno", () => {
    expect(isValidCaptureEmail("pessoa @example.com")).toBe(false);
    expect(isValidCaptureEmail("pessoa@exam\nple.com")).toBe(false);
  });

  it("rejeita entrada adversarial longa sem avaliar regex polinomial", () => {
    const adversarial = `!@!.${"!.".repeat(32_000)}x`;
    expect(isValidCaptureEmail(adversarial)).toBe(false);
  });
});
