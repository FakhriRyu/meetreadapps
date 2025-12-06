"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";


type Banner = {
    id: number;
    title: string;
    imageUrl: string;
    order: number;
    isActive: boolean;
    createdAt: string;
};

type BannerManagementPanelProps = {
    initialBanners: Banner[];
};

export function BannerManagementPanel({ initialBanners }: BannerManagementPanelProps) {
    const router = useRouter();
    const [banners, setBanners] = useState<Banner[]>(initialBanners);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('file', file);
            formData.append('order', String(banners.length + 1));
            formData.append('isActive', 'true');

            // Send to API route
            const response = await fetch("/api/admin/banners", {
                method: "POST",
                body: formData, // fetch will set the correct Content-Type for FormData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to create banner record");
            }

            const result = await response.json();
            setBanners((prev) => [result.banner, ...prev]);

            // Reset form
            setTitle("");
            setFile(null);
            setPreviewUrl(null);
            router.refresh();
            alert("Banner berhasil ditambahkan!");

        } catch (error: any) {
            console.error("Error adding banner:", error);
            alert(`Gagal menambahkan banner: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/banners/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete banner");
            }

            setBanners((prev) => prev.filter((b) => b.id !== id));
            router.refresh();
        } catch (error) {
            console.error("Error deleting banner:", error);
            alert("Gagal menghapus banner");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Tambah Banner Baru</h3>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Judul Banner</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Contoh: Promo Spesial Bulan Ini"
                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Gambar Banner</label>
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                                    required
                                />
                                <p className="mt-1 text-xs text-slate-500">Format: JPG, PNG, WEBP. Ukuran disarankan: 1200x400px.</p>
                            </div>
                            {previewUrl && (
                                <div className="relative h-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isUploading ? (
                            <>
                                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Mengupload...
                            </>
                        ) : (
                            "Upload Banner"
                        )}
                    </button>
                </form>
            </div>

            {/* Banner List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Daftar Banner Aktif</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {banners.map((banner) => (
                        <div key={banner.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                            <div className="relative aspect-[3/1] w-full bg-slate-100">
                                <Image
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    disabled={isLoading}
                                    className="absolute bottom-2 right-2 translate-y-2 rounded-lg bg-white/90 p-2 text-red-600 opacity-0 backdrop-blur-sm transition hover:bg-red-50 group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                                    title="Hapus Banner"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-3">
                                <p className="font-medium text-slate-900 line-clamp-1">{banner.title}</p>
                                <p className="text-xs text-slate-500">
                                    Diupload: {new Date(banner.createdAt).toLocaleDateString("id-ID")}
                                </p>
                            </div>
                        </div>
                    ))}

                    {banners.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-slate-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-slate-900">Belum ada banner</h3>
                            <p className="text-xs text-slate-500">Upload banner pertama Anda di atas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
