import { deleteAuthToken } from "./jwt";

let isLoggingOut = false;

export async function logoutAndPurge(reason = "unauthorized") {
    if (isLoggingOut) return;
    isLoggingOut = true;

    try {
        // 1) Delete caches
        try { localStorage.removeItem("pageCache"); } catch {}
        try { localStorage.removeItem("lastMutationTimestamp"); } catch {}
        try { localStorage.removeItem("filesInvalidated"); } catch {}
        try { deleteAuthToken(); } catch {}
        try { sessionStorage.clear() } catch {}
        
        // 2) Propagate logout to all tabs
        try {
            const bc = new BroadcastChannel("auth");
            bc.postMessage({ type: "logout", reason });
            bc.close();
        } catch {
            // Fallback to local storage
            try { localStorage.setItem("logout-event", String(Date.now())); } catch {}
        }
    } finally {
        // 3) Redirect
        window.location.replace("/login");
    }
}