import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  CircleDot, 
  Printer, 
  Camera, 
  Settings, 
  Calendar, 
  GraduationCap,
  Sparkles,
  ShieldCheck,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { userApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, StatusBadge, Alert } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { CertificateCard, CertificateDocument } from "../../components/Certificate.jsx";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarErr, setAvatarErr] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [activeCert, setActiveCert] = useState(null);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await userApi.studentProfile();
      setProfileData(res.data);
    } catch (err) {
      console.error("Failed to fetch student profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarErr("");
    setAvatarSuccess("");
    setUploadingAvatar(true);

    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await userApi.updateProfile(fd);
      setUser(res.data.user);
      setAvatarSuccess("Profile photo updated.");
      fetchProfile();
    } catch (err) {
      setAvatarErr(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePrintCertificate = (cert) => {
    setActiveCert(cert);
  };

  const summary = profileData?.learningSummary || {
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
    totalModulesCompleted: 0,
    totalLearningHours: 0,
  };

  const certificates = profileData?.certificates || [];
  const history = profileData?.learningHistory || [];
  const currentUser = profileData?.user || user;

  const avatarUrl = currentUser?.avatar
    ? (currentUser.avatar.startsWith("http") ? currentUser.avatar : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${currentUser.avatar}`)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-12">
      {/* Header Profile Card */}
      <div className="relative overflow-hidden rounded-[16px] border border-border-subtle bg-bg-surface p-6 sm:p-8 shadow-card">
        {/* Subtle architectural gradient contour */}
        <div className="absolute right-0 top-0 h-48 w-72 bg-gradient-to-bl from-primary-600/10 via-primary-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group shrink-0">
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-[12px] border border-border-default bg-bg-surface-raised text-2xl font-bold text-text-primary shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt={currentUser?.name} className="h-full w-full object-cover" />
              ) : (
                <span>{currentUser?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition-transform hover:bg-primary-700 active:scale-95"
              title="Upload new profile picture"
            >
              <Camera size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="type-h2 text-text-primary">
                {currentUser?.name}
              </h1>
              <span className="rounded-[4px] border border-primary-500/20 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-600/15 dark:text-primary-400">
                {currentUser?.role}
              </span>
            </div>

            <p className="mt-1 type-body text-text-secondary">{currentUser?.email}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 type-body-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <GraduationCap size={15} className="text-primary-600 dark:text-primary-400" />
                Track: {currentUser?.department || "Computer Science & Engineering"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-text-tertiary" />
                Joined {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Quoted bio line: ONLY spot reserved for serif warmth */}
            {currentUser?.bio && (
              <p className="mt-3 max-w-xl font-serif text-sm italic text-text-secondary">
                "{currentUser.bio}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/dashboard/settings">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Settings size={14} />
                Edit Settings
              </Button>
            </Link>
          </div>
        </div>

        {avatarSuccess && (
          <div className="mt-4 rounded-[6px] border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {avatarSuccess}
          </div>
        )}
        {avatarErr && (
          <div className="mt-4 rounded-[6px] border border-rose-500/25 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-400">
            {avatarErr}
          </div>
        )}
      </div>

      {/* Learning Summary Metric Cards (16px gap, 24px padding) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <span className="mt-3 type-h2 text-text-primary">
            {summary.completedCourses}
          </span>
          <span className="type-caption text-text-tertiary">
            Completed
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CircleDot size={18} />
          </div>
          <span className="mt-3 type-h2 text-text-primary">
            {summary.inProgressCourses}
          </span>
          <span className="type-caption text-text-tertiary">
            In Progress
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
            <BookOpen size={18} />
          </div>
          <span className="mt-3 type-h2 text-text-primary">
            {summary.notStartedCourses}
          </span>
          <span className="type-caption text-text-tertiary">
            Not Started
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-primary-500/20 bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-400">
            <Sparkles size={18} />
          </div>
          <span className="mt-3 type-h2 text-text-primary">
            {summary.totalModulesCompleted}
          </span>
          <span className="type-caption text-text-tertiary">
            Modules Completed
          </span>
        </Card>

        <Card className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border-default bg-bg-surface-raised text-text-secondary">
            <Clock size={18} />
          </div>
          <span className="mt-3 type-h2 text-text-primary">
            {summary.totalLearningHours}h
          </span>
          <span className="type-caption text-text-tertiary">
            Learning Hours
          </span>
        </Card>
      </div>

      {/* Certificates Earned Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 className="type-h2 text-text-primary">
              Certificates of Completion
            </h2>
          </div>
          <span className="type-caption text-text-tertiary">
            {certificates.length} Verified {certificates.length === 1 ? "Credential" : "Credentials"}
          </span>
        </div>

        {certificates.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
              <Award size={24} />
            </div>
            <h3 className="mt-3 type-h3 text-text-primary">
              No certificates earned yet
            </h3>
            <p className="mx-auto mt-1 max-w-md type-body-sm text-text-secondary">
              Complete all course modules to generate your verified completion certificate.
            </p>
            <div className="mt-5">
              <Link to="/dashboard/my-courses">
                <Button variant="primary" size="sm">
                  View Course Catalog
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.id}
                cert={cert}
                onPrint={handlePrintCertificate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Learning History / Transcript Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 className="type-h2 text-text-primary">
              Academic Transcript & Course History
            </h2>
          </div>
          <span className="type-caption text-text-tertiary">
            {history.length} enrolled {history.length === 1 ? "course" : "courses"}
          </span>
        </div>

        {history.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="type-body text-text-secondary">
              No course enrollments on record.
            </p>
            <div className="mt-4">
              <Link to="/dashboard/my-courses">
                <Button variant="primary" size="sm">Browse Catalog</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left type-body">
                <thead className="border-b border-border-subtle bg-bg-surface-raised text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  <tr>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Track / Category</th>
                    <th className="px-5 py-3.5">Enrolled</th>
                    <th className="px-5 py-3.5">Progress</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {history.map((record) => {
                    const course = record.course || {};
                    const isCompleted = record.status === "completed" || record.progress >= 100;
                    const isInProgress = record.progress > 0 && !isCompleted;
                    const statusKey = isCompleted ? "completed" : isInProgress ? "in-progress" : "upcoming";

                    return (
                      <tr key={record._id} className="transition-colors hover:bg-bg-surface-raised/50">
                        <td className="px-5 py-4 font-medium text-text-primary">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
                              <BookOpen size={15} />
                            </div>
                            <span className="line-clamp-1">{course.title || "Course"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 type-body-sm text-text-secondary">
                          {course.category || "General"}
                        </td>
                        <td className="px-5 py-4 type-body-sm text-text-secondary">
                          {new Date(record.enrollmentDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="w-32">
                            <div className="flex justify-between type-caption text-text-secondary mb-1">
                              <span>{record.completedModules?.length || 0} mods</span>
                              <span>{record.progress}%</span>
                            </div>
                            <ProgressBar value={record.progress} />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={statusKey} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link to={`/dashboard/my-courses/${course._id}`}>
                            <Button size="xs" variant="secondary">
                              {isCompleted ? "Review" : "Continue"}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Official Certificate Modal View */}
      {activeCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm print:p-0 print:bg-white print:static">
          <div className="relative flex flex-col items-center max-w-3xl w-full">
            <button
              onClick={() => setActiveCert(null)}
              className="absolute -top-10 right-0 text-text-secondary hover:text-white print:hidden transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            <CertificateDocument cert={activeCert} />

            <div className="mt-6 flex items-center gap-3 print:hidden">
              <Button variant="primary" onClick={() => window.print()} className="gap-2">
                <Printer size={16} />
                Print Credential
              </Button>
              <Button variant="secondary" onClick={() => setActiveCert(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
