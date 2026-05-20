import { useEffect, useState } from "react";
import { User, Mail, Phone, Briefcase, MapPin, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("+255-62599-7791");
  const [adminEmail, setAdminEmail] = useState("admin@smartdar.tz");

  const profile = {
    name: "Ilala Municipal Council",
    role: "System Administrator",
    email: adminEmail,
    phone: phone,
    organization: "Ilala Municipal Monitoring",
    location: "Dar es salaam, Tanzania",
    joined: "March 2026",
    bio: "Leads monitoring, contractor coordination, and incident response across the smartDar network.",
  };

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setAdminEmail(user.email || "admin@smartdar.tz");

          // Fetch phone from admin_profiles_table
          const { data, error: fetchError } = await supabase
            .from("admin_profiles_table")
            .select("phone")
            .eq("email", user.email)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching admin profile:", fetchError);
          } else if (data?.phone) {
            setPhone(data.phone);
          }
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const handleSavePhone = async () => {
    if (!phone.trim()) {
      setError("Phone number is required for WhatsApp alerts");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("admin_profiles_table")
        .update({ phone, updated_at: new Date().toISOString() })
        .eq("email", user.email);

      if (updateError) throw updateError;

      setIsEditing(false);
      alert(
        "Phone number saved successfully! WhatsApp alerts will be sent to this number.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save phone number",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase text-green-600">
              Admin Profile
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              {profile.name}
            </h1>
            <p className="mt-2 text-gray-600 max-w-2xl">{profile.bio}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 overflow-hidden rounded-3xl bg-gray-100 border border-gray-200">
              <img
                src="/Assets/Manispaa.png"
                alt="Manispaa"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{profile.role}</p>
              <p className="text-sm text-gray-500">{profile.organization}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-gray-200 bg-green-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-green-700">
                <User className="h-5 w-5" />
                <span className="font-semibold">Contact Details</span>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{profile.email}</span>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{phone}</span>
                  {phone && (
                    <span className="text-xs text-green-600 font-semibold">
                      ✓ Alerts enabled
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{profile.location}</span>
              </div>
            </div>
            {isEditing && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSavePhone}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400 transition"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3 text-gray-900">
              <Briefcase className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Account Info</span>
            </div>
            <div className="mt-4 space-y-3 text-gray-700">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span>Role</span>
                <strong>{profile.role}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span>Organization</span>
                <strong>{profile.organization}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span>Member since</span>
                <strong>{profile.joined}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-green-700">
            <Clock4 className="h-5 w-5" />
            <span className="font-semibold">Shift Focus</span>
          </div>
          <p className="mt-3 text-gray-600">
            Responsible for 24/7 system monitoring and contractor outreach.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-green-700">
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">Primary Zone</span>
          </div>
          <p className="mt-3 text-gray-600">
            Central Dar es salaam operations and national alert coordination.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-green-700">
            <Briefcase className="h-5 w-5" />
            <span className="font-semibold">Priorities</span>
          </div>
          <p className="mt-3 text-gray-600">
            Manage alerts, validate sensor status, and dispatch contractors when
            needed.
          </p>
        </div>
      </div>
    </div>
  );
}
