"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Avatar() {
  const [image, setImage] = useState<File | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const handleSubmit = async () => {
    if (image) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user?.email || "");
      if (data && data[0] && data[0].id) {
        await supabase.storage
          .from("profile-images")
          .update(`avatar_${data[0].id}.png`, image);
      }

      router.refresh();
    }
  };
  return (
    <div>
      <label htmlFor="image">Image:</label>

      <input
        type="file"
        id="image"
        name="image"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
      />
      <button onClick={handleSubmit}>Submit Image</button>
    </div>
  );
}
