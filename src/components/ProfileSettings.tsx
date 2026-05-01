import { useState, useRef } from "react";
import { useUserProfile } from "../hooks/useUserProfile";

export default function ProfileSettings() {
  const { profile, loading, error, updateProfile, uploadAvatar } =
    useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [editData, setEditData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
    organization: profile?.organization || "",
    bio: profile?.bio || "",
    city: profile?.city || "",
    country: profile?.country || "",
  });

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setUpdateError("");
    setUpdateSuccess("");
    setUpdateLoading(true);

    try {
      await updateProfile({
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone || null,
        organization: editData.organization || null,
        bio: editData.bio || null,
        city: editData.city || null,
        country: editData.country || null,
      });
      setUpdateSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUpdateError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError("File size must be less than 5MB");
      return;
    }

    setUpdateError("");
    setUploadingAvatar(true);

    try {
      await uploadAvatar(file);
      setUpdateSuccess("Avatar uploaded successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : "Failed to upload avatar",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading profile: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Success Message */}
      {updateSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 font-medium">{updateSuccess}</p>
        </div>
      )}

      {/* Error Message */}
      {updateError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{updateError}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-md p-8 space-y-8">
        {/* Avatar Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Profile Picture
          </h3>
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center cursor-pointer hover:opacity-75 transition"
              onClick={handleAvatarClick}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition"
              >
                {uploadingAvatar ? "Uploading..." : "Upload Photo"}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG or GIF (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>
            <button
              onClick={() => {
                if (isEditing) {
                  setEditData({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    phone: profile.phone || "",
                    organization: profile.organization || "",
                    bio: profile.bio || "",
                    city: profile.city || "",
                    country: profile.country || "",
                  });
                }
                setIsEditing(!isEditing);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={editData.first_name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={editData.last_name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                  placeholder="+255 123 456 789"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  name="organization"
                  value={editData.organization}
                  onChange={handleEditChange}
                  placeholder="Your organization"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={editData.city}
                  onChange={handleEditChange}
                  placeholder="Your city"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={editData.country}
                  onChange={handleEditChange}
                  placeholder="Your country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={editData.bio}
                  onChange={handleEditChange}
                  placeholder="Tell us about yourself"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                disabled={updateLoading}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition"
              >
                {updateLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <p className="text-sm text-gray-600 font-medium">First Name</p>
                <p className="text-lg text-gray-900 mt-1">
                  {profile.first_name || "-"}
                </p>
              </div>

              {/* Last Name */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Last Name</p>
                <p className="text-lg text-gray-900 mt-1">
                  {profile.last_name || "-"}
                </p>
              </div>

              {/* Email */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Email</p>
                <p className="text-lg text-gray-900 mt-1">{profile.email}</p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Phone</p>
                <p className="text-lg text-gray-900 mt-1">
                  {profile.phone || "-"}
                </p>
              </div>

              {/* Organization */}
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Organization
                </p>
                <p className="text-lg text-gray-900 mt-1">
                  {profile.organization || "-"}
                </p>
              </div>

              {/* City */}
              <div>
                <p className="text-sm text-gray-600 font-medium">City</p>
                <p className="text-lg text-gray-900 mt-1">
                  {profile.city || "-"}
                </p>
              </div>

              {/* Country */}
              <div>
                <p className="text-sm text-gray-600 font-medium">Country</p>
                <p className="text-lg text-gray-900 mt-1">
                  {profile.country || "-"}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Account Status
                </p>
                <p className="text-lg text-gray-900 mt-1">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {profile.status}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
