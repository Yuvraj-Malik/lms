import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  CircleDot, 
  Download, 
  Printer, 
  Camera, 
  Settings, 
  Calendar, 
  ExternalLink,
  GraduationCap,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { userApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Badge, Alert } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

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
      console.error("Failed to fetch full student profile:", err);
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
      setAvatarSuccess("Profile photo updated successfully!");
      fetchProfile();
    } catch (err) {
      setAvatarErr(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePrintCertificate = (cert) => {
    setActiveCert(cert);
    setTimeout(() => {
      window.print();
    }, 300);
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pine to-pine-dark p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 top-0 h-32 w-32 rounded-full bg-amber/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/20 bg-surface-sunken text-3xl font-bold text-pine shadow-inner dark:bg-dark-surface-sunken">
              {avatarUrl ? (
                <img src={avatarUrl} alt={currentUser?.name} className="h-full w-full object-cover" />
              ) : (
                <span>{currentUser?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber text-pine shadow-md transition-transform hover:scale-110 active:scale-95"
              title="Upload new profile picture"
            >
              <Camera size={16} />
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
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {currentUser?.name}
              </h1>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide backdrop-blur-sm">
                {currentUser?.role}
              </span>
            </div>

            <p className="mt-1 text-sm text-white/80">{currentUser?.email}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-white/90">
              <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 backdrop-blur-sm">
                <GraduationCap size={14} className="text-amber-light" />
                Track: {currentUser?.department || "Computer Science & Engineering"}
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 backdrop-blur-sm">
                <Calendar size={14} className="text-amber-light" />
                Joined {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>

            {currentUser?.bio && (
              <p className="mt-3 max-w-xl text-xs sm:text-sm text-white/80 italic">
                "{currentUser.bio}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard/settings">
              <Button tone="ghost" className="border border-white/30 text-white hover:bg-white/15">
                <Settings size={16} className="mr-1.5" />
                Edit Settings
              </Button>
            </Link>
          </div>
        </div>

        {avatarSuccess && (
          <div className="mt-4 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-medium text-white backdrop-blur">
            {avatarSuccess}
          </div>
        )}
        {avatarErr && (
          <div className="mt-4 rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-medium text-white backdrop-blur">
            {avatarErr}
          </div>
        )}
      </div>

      {/* Learning Summary Metric Cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
          <span className="mt-2 text-2xl font-bold text-ink dark:text-dark-ink">
            {summary.completedCourses}
          </span>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft font-medium">
            Completed
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/10 text-amber dark:bg-amber-light/10 dark:text-amber-light">
            <CircleDot size={20} />
          </div>
          <span className="mt-2 text-2xl font-bold text-ink dark:text-dark-ink">
            {summary.inProgressCourses}
          </span>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft font-medium">
            In Progress
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken text-ink-soft dark:bg-dark-surface-sunken dark:text-dark-ink-soft">
            <BookOpen size={20} />
          </div>
          <span className="mt-2 text-2xl font-bold text-ink dark:text-dark-ink">
            {summary.notStartedCourses}
          </span>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft font-medium">
            Not Started
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10 text-pine dark:bg-pine-light/10 dark:text-pine-light">
            <Sparkles size={20} />
          </div>
          <span className="mt-2 text-2xl font-bold text-ink dark:text-dark-ink">
            {summary.totalModulesCompleted}
          </span>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft font-medium">
            Modules Mastered
          </span>
        </Card>

        <Card className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Clock size={20} />
          </div>
          <span className="mt-2 text-2xl font-bold text-ink dark:text-dark-ink">
            {summary.totalLearningHours}h
          </span>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft font-medium">
            Learning Hours
          </span>
        </Card>
      </div>

      {/* Certificates Earned Section (MUST HAVE) */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="text-amber" size={24} />
            <h2 className="font-display text-xl font-bold text-ink dark:text-dark-ink">
              Certificates of Completion
            </h2>
          </div>
          <span className="text-xs font-semibold text-ink-soft dark:text-dark-ink-soft">
            {certificates.length} Verified {certificates.length === 1 ? "Award" : "Awards"}
          </span>
        </div>

        {certificates.length === 0 ? (
          <Card className="mt-4 border-dashed p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/10 text-amber dark:bg-amber-light/10 dark:text-amber-light">
              <Award size={28} />
            </div>
            <h3 className="mt-3 font-display text-base font-semibold text-ink dark:text-dark-ink">
              No certificates earned yet
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-ink-soft dark:text-dark-ink-soft">
              Complete 100% of all course modules to earn an official accredited Ridgeline Completion Certificate!
            </p>
            <div className="mt-4">
              <Link to="/dashboard/my-courses">
                <Button tone="pine" size="sm">
                  Explore Courses
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="relative overflow-hidden rounded-2xl border border-amber/30 bg-gradient-to-br from-amber/5 via-surface to-surface-raised p-6 shadow-md transition-shadow hover:shadow-lg dark:border-amber-light/30 dark:from-amber-light/5 dark:via-dark-surface dark:to-dark-surface-raised"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 text-amber dark:text-amber-light">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-amber uppercase dark:text-amber-light">
                        Verified Certificate
                      </span>
                      <h3 className="font-display text-base font-bold text-ink dark:text-dark-ink line-clamp-1">
                        {cert.courseTitle}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-b border-border/60 py-3 text-xs dark:border-dark-border/60">
                  <div className="flex justify-between">
                    <span className="text-ink-soft dark:text-dark-ink-soft">Awarded To:</span>
                    <span className="font-semibold text-ink dark:text-dark-ink">{cert.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft dark:text-dark-ink-soft">Credential ID:</span>
                    <span className="font-mono font-medium text-ink-soft dark:text-dark-ink-soft">{cert.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft dark:text-dark-ink-soft">Issued Date:</span>
                    <span className="text-ink dark:text-dark-ink">
                      {new Date(cert.issueDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-ink-soft dark:text-dark-ink-soft">
                    100% Curriculum Completed
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      tone="secondary"
                      onClick={() => handlePrintCertificate(cert)}
                      className="gap-1.5"
                    >
                      <Printer size={14} /> Print Certificate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Learning History / Transcript Table (MUST HAVE) */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-pine dark:text-amber-light" size={24} />
            <h2 className="font-display text-xl font-bold text-ink dark:text-dark-ink">
              Learning Transcript & Course History
            </h2>
          </div>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft">
            {history.length} enrolled courses
          </span>
        </div>

        {history.length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <p className="text-sm text-ink-soft dark:text-dark-ink-soft">
              You haven't enrolled in any courses yet.
            </p>
            <div className="mt-4">
              <Link to="/dashboard/my-courses">
                <Button tone="pine" size="sm">Browse Course Catalog</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-sunken/60 text-xs font-semibold text-ink-soft uppercase dark:border-dark-border dark:bg-dark-surface-sunken/60 dark:text-dark-ink-soft">
                  <tr>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Track / Category</th>
                    <th className="px-5 py-3.5">Enrolled Date</th>
                    <th className="px-5 py-3.5">Progress</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                  {history.map((record) => {
                    const course = record.course || {};
                    const isCompleted = record.status === "completed" || record.progress >= 100;
                    const isInProgress = record.progress > 0 && !isCompleted;

                    return (
                      <tr key={record._id} className="transition-colors hover:bg-surface-sunken/40 dark:hover:bg-dark-surface-sunken/40">
                        <td className="px-5 py-4 font-semibold text-ink dark:text-dark-ink">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine dark:bg-pine-light/10 dark:text-pine-light">
                              <BookOpen size={18} />
                            </div>
                            <span className="line-clamp-1">{course.title || "Course"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft font-medium">
                          {course.category || "General"}
                        </td>
                        <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft">
                          {new Date(record.enrollmentDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="w-32">
                            <div className="flex justify-between text-[11px] font-medium text-ink-soft dark:text-dark-ink-soft mb-1">
                              <span>{record.completedModules?.length || 0} modules</span>
                              <span>{record.progress}%</span>
                            </div>
                            <ProgressBar value={record.progress} />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {isCompleted ? (
                            <Badge tone="pine">Completed</Badge>
                          ) : isInProgress ? (
                            <Badge tone="amber">In Progress</Badge>
                          ) : (
                            <Badge tone="neutral">Not Started</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link to={`/dashboard/my-courses/${course._id}`}>
                            <Button size="xs" tone="secondary">
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

      {/* Hidden Print Certificate Modal / View */}
      {activeCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:p-0 print:bg-white print:static">
          <div className="relative w-full max-w-3xl rounded-3xl border-8 border-double border-amber-600 bg-white p-10 text-center text-slate-800 shadow-2xl print:border-none print:shadow-none">
            <button
              onClick={() => setActiveCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 print:hidden text-lg font-bold"
            >
              ✕
            </button>

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Award size={48} />
            </div>

            <p className="mt-4 text-xs font-bold tracking-widest text-amber-600 uppercase">
              Official Certificate of Mastery
            </p>
            <h2 className="mt-2 font-display text-4xl font-extrabold text-slate-900">
              Certificate of Completion
            </h2>

            <p className="mt-6 text-sm text-slate-500">This is to certify that</p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-800 underline decoration-amber-400 decoration-2 underline-offset-8">
              {activeCert.studentName}
            </p>

            <p className="mt-6 text-sm text-slate-500">has successfully completed all requirements for</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {activeCert.courseTitle}
            </h3>

            <div className="mt-8 flex justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Issued On</p>
                <p>{new Date(activeCert.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Ridgeline LMS</p>
                <p className="italic">Verified Digital Credential</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Credential ID</p>
                <p className="font-mono">{activeCert.id}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3 print:hidden">
              <Button tone="pine" onClick={() => window.print()}>
                <Printer size={16} className="mr-1.5" /> Print Now
              </Button>
              <Button tone="secondary" onClick={() => setActiveCert(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
