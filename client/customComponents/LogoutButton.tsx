"use client";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
function LogoutButton() {
  const supabase = createClientComponentClient<Database>();
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    window.location.reload();
  };
  return (
    <Button
      onClick={() => {
        logout();
      }}
    >
      Logout
    </Button>
  );
}

export default LogoutButton;
