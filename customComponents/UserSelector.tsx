"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
type OnSelectionChangeType = (selectedUsers: string[]) => void;
interface UserSelectorProps {
  onSelectionChange: OnSelectionChangeType;
}
type raw_user_meta_data =
  Database["public"]["Tables"]["profiles"]["Row"]["raw_user_meta_data"];
type ProfileData =
  | {
      id: string;
      email: string;
      raw_user_meta_data: raw_user_meta_data;
    }[]
  | null;

export default function UserSelector({ onSelectionChange }: UserSelectorProps) {
  const supabase = createClientComponentClient<Database>({});
  const [profileData, setProfileData] = useState<ProfileData>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,email,raw_user_meta_data");
        setProfileData(data);
      } catch (error) {
        // setError(error.message);
      }
    };

    fetchData();
  }, []);
  const handleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  return (
    <div>
      {profileData?.map((user) => (
        <div key={user.id}>
          <input
            type="checkbox"
            checked={selectedUsers.includes(user.email)}
            onChange={() => handleUserSelection(user.email)}
          />
          {user.raw_user_meta_data?.name}
          <br />
          Email: {user.email}
        </div>
      ))}
      <button onClick={() => onSelectionChange(selectedUsers)}>Confirm!</button>
    </div>
  );
}
