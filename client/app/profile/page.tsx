"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { Database } from "@/codelib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Avatar from "../../customComponents/AvatarSelector";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
export default function Profile() {
  const router = useRouter();
  const [aboutData, setAboutData] = useState<string>("");
  const [newAbout, setnewAbout] = useState<string>("");
  const supabase = createClientComponentClient<Database>({});
  const sendAbout = async () => {
    const res = await fetch("/update/about", {
      method: "post",
      body: JSON.stringify({ about: newAbout }),
    });
    setnewAbout("");
    const data = await res.json();
    if (data.status === 200) {
      toast.success("About updated");
    } else {
      toast.error("Something went wrong!");
    }
  };
  useEffect(() => {
    const getData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/unauthenticated");
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: aboutLoadData, error } = await supabase
        .from("profiles")
        .select("about")
        .eq("id", user?.id || "")
        .single();
      if (aboutLoadData) {
        setAboutData(aboutLoadData.about as string);
      }
    };
    getData();
  });

  return (
    <div>
      <div className="mt-4 text-center">Profile</div>

      <label htmlFor="about" className="block">
        About: {aboutData}
      </label>
      <Input
        type="text"
        id="about"
        name="about"
        onChange={(e) => setnewAbout(e.target.value)}
        className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:border-blue-300"
      />
      <Button
        type="submit"
        className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 cursor-pointer"
        onClick={() => {
          sendAbout();
        }}
      >
        Submit
      </Button>

      <Avatar />
    </div>
  );
}
