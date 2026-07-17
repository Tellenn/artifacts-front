"use server";

// Server Actions : le POST part du serveur Next vers le backend (même origine
// côté navigateur), ce qui évite tout souci CORS. Le backend assigne une mission
// HUMAN_ORDER à Aerith puis répond 202 (acceptée) / 409 (refusée+raison) / 400.

const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8888";

export interface GeActionResult {
  ok: boolean;
  message: string;
}

interface GeMissionResponse {
  status: string;
  reason?: string;
}

async function postGe(path: string, body: unknown): Promise<GeActionResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/grand-exchange/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Backend injoignable." };
  }

  const payload = (await response.json().catch(() => null)) as GeMissionResponse | null;

  if (response.status === 202) {
    return { ok: true, message: "Mission confiée à Aerith." };
  }
  return {
    ok: false,
    message: payload?.reason ?? `Refusé (${response.status}).`,
  };
}

export async function submitBuy(
  code: string,
  quantity: number,
  maxUnitPrice: number,
): Promise<GeActionResult> {
  return postGe("buy", { code, quantity, maxUnitPrice });
}

export async function submitSell(
  code: string,
  quantity: number,
  unitPrice: number,
): Promise<GeActionResult> {
  return postGe("sell", { code, quantity, unitPrice });
}

export async function submitCancel(orderId: string): Promise<GeActionResult> {
  return postGe("cancel", { orderId });
}
