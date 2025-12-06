"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { upsertSilentReadingEvent, toggleSilentReadingEvent } from "@/actions/silent-reading";
import type { Database } from "@/types/database.types";
import { Calendar, Plus, Power, Users } from "lucide-react";

type SilentReadingEvent = Database["public"]["Tables"]["SilentReadingEvent"]["Row"];

interface SilentReadingEventPanelProps {
    initialEvents: SilentReadingEvent[];
}

export function SilentReadingEventPanel({ initialEvents }: SilentReadingEventPanelProps) {
    const [events, setEvents] = useState<SilentReadingEvent[]>(initialEvents);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form definitions
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("https://zmfoiuhjdsozeuriwzkb.supabase.co/storage/v1/object/public/AssetsMeetread/CoverSR.png");

    // Edit & Upload state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const supabase = createSupabaseClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Call Server Action
            const result = await upsertSilentReadingEvent({
                id: editingId,
                title,
                description: description || null,
                startDate: new Date(startDate).toISOString(),
                coverImageUrl,
                // Only include isActive if creating new, default true handled in action
                isActive: editingId ? undefined : true
            });

            if (result.error) {
                throw new Error(result.error);
            }

            const data = result.data;

            if (editingId) {
                setEvents(events.map(ev => ev.id === editingId ? (data as SilentReadingEvent) : ev));
                alert("Event berhasil diperbarui!");
            } else {
                setEvents([data as SilentReadingEvent, ...events]);
                alert("Event Silent Reading berhasil dibuat!");
            }

            setIsCreating(false);
            resetForm();
        } catch (error) {
            console.error("Error saving event:", JSON.stringify(error, null, 2));
            alert(`Gagal menyimpan event: ${(error as any)?.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setIsUploading(true);
        try {
            // File upload still happens client-side as it deals with Blob/File objects best
            // RLS for storage buckets is usually separate from DB tables.
            // If storage RLS is also an issue, we might need a Signed URL approach or Server Action for upload.
            // For now assuming storage allows public uploads or authenticated uploads. 
            const { error: uploadError } = await supabase.storage
                .from('silent-reading-covers')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('silent-reading-covers')
                .getPublicUrl(filePath);

            setCoverImageUrl(data.publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Gagal mengupload gambar.');
        } finally {
            setIsUploading(false);
        }
    };

    const startEditing = (event: SilentReadingEvent) => {
        setEditingId(event.id);
        setTitle(event.title);
        setDescription(event.description || "");
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        let date;
        try {
            date = new Date(event.startDate);
            if (isNaN(date.getTime())) throw new Error("Invalid date");
        } catch {
            date = new Date(); // Fallback to now
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setStartDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        setCoverImageUrl(event.coverImageUrl || "https://zmfoiuhjdsozeuriwzkb.supabase.co/storage/v1/object/public/AssetsMeetread/CoverSR.png");
        setIsCreating(true);
    };

    const toggleActiveHandler = async (id: number, currentStatus: boolean) => {
        try {
            // Optimistic update
            setEvents(events.map(ev => ev.id === id ? { ...ev, isActive: !currentStatus } : ev));

            const result = await toggleSilentReadingEvent(id, !currentStatus);

            if (result.error) {
                // Revert on error
                setEvents(events.map(ev => ev.id === id ? { ...ev, isActive: currentStatus } : ev));
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            alert("Gagal mengubah status event.");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setStartDate("");
        setCoverImageUrl("https://zmfoiuhjdsozeuriwzkb.supabase.co/storage/v1/object/public/AssetsMeetread/CoverSR.png");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Daftar Event</h2>
                    <p className="text-sm text-slate-500">Kelola jadwal Silent Reading mingguan</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsCreating(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                    <Plus className="h-4 w-4" />
                    Buat Event Baru
                </button>
            </div>

            {isCreating && (
                <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6">
                    <h3 className="mb-4 font-bold text-slate-900">{editingId ? 'Edit Event' : 'Form Event Baru'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Judul Kegiatan</label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Silent Reading #1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Waktu Mulai</label>
                            <input
                                type="datetime-local"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi (Opsional)</label>
                            <textarea
                                rows={3}
                                placeholder="Deskripsi singkat kegiatan..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Gambar Sampul</label>

                            {/* File Upload Input */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                                className="mb-2 w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-xl file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                            />

                            {/* URL Fallback (Hidden or Optional) - Keeping strictly file upload as requested, but maybe showing URL for debug/custom */}
                            {/* <input
                                type="url"
                                placeholder="https://..."
                                value={coverImageUrl}
                                onChange={(e) => setCoverImageUrl(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            /> */}

                            {isUploading && <p className="text-xs text-indigo-600">Mengupload gambar...</p>}

                            {coverImageUrl && (
                                <div className="mt-2 relative h-32 w-full overflow-hidden rounded-xl border border-slate-200">
                                    <img
                                        src={coverImageUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}

                            <p className="mt-1 text-xs text-slate-500">
                                Upload gambar (Max 2MB). Resolusi rekomendasi: 940x788 px.
                                <br />Jika tidak diisi akan menggunakan default.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isLoading ? "Menyimpan..." : (editingId ? "Update Event" : "Simpan Event")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <div key={event.id} className="relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                        <div>
                            <div className="mb-3 flex items-start justify-between">
                                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${event.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                    }`}>
                                    {event.isActive ? "Aktif" : "Selesai"}
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEditing(event)}
                                        className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => toggleActiveHandler(event.id, event.isActive)}
                                        title={event.isActive ? "Matikan Event" : "Aktifkan Event"}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${event.isActive
                                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                            }`}
                                    >
                                        <Power className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-900">{event.title}</h3>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                    {(() => {
                                        try {
                                            return format(new Date(event.startDate), "EEEE, d MMMM yyyy • HH:mm", { locale: idLocale });
                                        } catch {
                                            return '-';
                                        }
                                    })()}
                                </span>
                            </div>
                            {event.description && (
                                <p className="mt-3 text-sm text-slate-600 line-clamp-2">{event.description}</p>
                            )}
                        </div>

                        <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                <Users className="h-3.5 w-3.5" />
                                <span>0 Peserta</span> {/* Placeholder for count logic later if needed */}
                            </div>
                            <span className="text-xs text-slate-400">ID: {event.id}</span>
                        </div>
                    </div>
                ))}

                {events.length === 0 && !isCreating && (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 font-semibold text-slate-900">Belum ada event</h3>
                        <p className="max-w-xs text-sm text-slate-500">Buat event silent reading pertama Anda untuk memulai kegiatan komunitas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
