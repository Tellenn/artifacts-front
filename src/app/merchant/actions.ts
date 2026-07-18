"use server";

// Server Action : le POST part du serveur Next vers le backend (même origine
// côté navigateur ⇒ pas de CORS). Le backend cherche un marchand FIXE (hors
// événement) vendant l'item, puis confie une mission HUMAN_ORDER à Aerith.
// Réponses : 202 (acceptée) / 409 (refusée+raison) / 400 (requête invalide).

const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8888";

export interface MerchantActionResult {
  ok: boolean;
  message: string;
}

interface MerchantMissionResponse {
  status: string;
  reason?: string;
}

export async function submitMerchantBuy(
  code: string,
  quantity: number,
): Promise<MerchantActionResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/merchant/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, quantity }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Backend injoignable." };
  }

  const payload = (await response
    .json()
    .catch(() => null)) as MerchantMissionResponse | null;

  if (response.status === 202) {
    return { ok: true, message: "Mission confiée à Aerith." };
  }
  return {
    ok: false,
    message: payload?.reason ?? `Refusé (${response.status}).`,
  };
}
