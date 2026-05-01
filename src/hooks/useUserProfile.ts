import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  organization: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Try to fetch profile from database
        const { data: profileData, error: profileError } = await supabase
          .from("users_profile")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          // PGRST116 = no rows returned
          throw profileError;
        }

        if (profileData) {
          setProfile(profileData as UserProfile);
        } else {
          // Profile doesn't exist yet, create it with auth data
          // Use .select() to trigger the proper RLS context
          const { data: newProfile, error: createError } = await supabase
            .from("users_profile")
            .insert([
              {
                user_id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || "",
                last_name: user.user_metadata?.last_name || "",
                status: "active",
                role: "user",
              },
            ])
            .select();

          if (createError) {
            console.error("Create profile error:", createError);
            throw createError;
          }

          if (newProfile && newProfile.length > 0) {
            setProfile(newProfile[0] as UserProfile);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) {
      setError("Profile not loaded");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("users_profile")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile({ ...profile, ...updates });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!profile) {
      throw new Error("Profile not loaded");
    }

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `user-profile-picture/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("smartDar-componets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("smartDar-componets").getPublicUrl(filePath);

      // Update profile with avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return publicUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    }
  };

  return { profile, loading, error, updateProfile, uploadAvatar };
};
