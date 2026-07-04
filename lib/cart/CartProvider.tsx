"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  addGuestLine,
  clearGuest,
  getGuestLines,
  setGuestQty,
} from "@/lib/cart/guest";

export interface CartLine {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  itemId?: string; // present only for server (logged-in) rows
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  ready: boolean;
  authed: boolean;
  add: (product_id: string, variant_id: string | null, qty: number) => Promise<void>;
  setQty: (line: CartLine, qty: number) => Promise<void>;
  remove: (line: CartLine) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const mergedRef = useRef(false);

  const authed = !!user;

  const loadServerLines = useCallback(async () => {
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, variant_id, quantity");
    setLines(
      (data ?? []).map((r) => ({
        itemId: r.id as string,
        product_id: r.product_id as string,
        variant_id: (r.variant_id as string | null) ?? null,
        quantity: r.quantity as number,
      })),
    );
  }, [supabase]);

  const loadGuestLines = useCallback(() => {
    setLines(getGuestLines());
  }, []);

  const refresh = useCallback(async () => {
    if (user) await loadServerLines();
    else loadGuestLines();
  }, [user, loadServerLines, loadGuestLines]);

  // Run cart-merge-on-login exactly once when we land with ?merge=1.
  const mergeOnLogin = useCallback(async () => {
    if (mergedRef.current) return;
    mergedRef.current = true;
    const guest = getGuestLines();
    if (guest.length > 0) {
      const { error } = await supabase.rpc("merge_guest_cart", {
        p_items: guest,
      });
      if (error) {
        // Keep the guest cart so nothing is lost; user can retry.
        mergedRef.current = false;
        return;
      }
    }
    clearGuest();
    await loadServerLines();
  }, [supabase, loadServerLines]);

  // Bootstrap: determine auth, load lines, wire auth-change listener.
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(u);

      const wantsMerge =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("merge") === "1";

      if (u && wantsMerge) await mergeOnLogin();
      else if (u) await loadServerLines();
      else loadGuestLines();

      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Reload lines when auth state flips after bootstrap.
  useEffect(() => {
    if (ready) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const add = useCallback(
    async (product_id: string, variant_id: string | null, qty: number) => {
      if (qty <= 0) return;
      if (user) {
        await supabase.rpc("merge_guest_cart", {
          p_items: [{ product_id, variant_id, quantity: qty }],
        });
        await loadServerLines();
      } else {
        addGuestLine({ product_id, variant_id, quantity: qty });
        loadGuestLines();
      }
    },
    [user, supabase, loadServerLines, loadGuestLines],
  );

  const setQty = useCallback(
    async (line: CartLine, qty: number) => {
      if (user) {
        if (!line.itemId) return;
        if (qty <= 0) {
          await supabase.from("cart_items").delete().eq("id", line.itemId);
        } else {
          await supabase
            .from("cart_items")
            .update({ quantity: qty })
            .eq("id", line.itemId);
        }
        await loadServerLines();
      } else {
        setGuestQty(line.product_id, line.variant_id, qty);
        loadGuestLines();
      }
    },
    [user, supabase, loadServerLines, loadGuestLines],
  );

  const remove = useCallback((line: CartLine) => setQty(line, 0), [setQty]);

  const count = useMemo(
    () => lines.reduce((n, l) => n + l.quantity, 0),
    [lines],
  );

  const value: CartContextValue = {
    lines,
    count,
    ready,
    authed,
    add,
    setQty,
    remove,
    refresh,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
