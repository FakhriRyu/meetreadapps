"use client";

import { formatDate } from "@/lib/intl-format";

type Suggestion = {
    id: number;
    suggestion: string;
    createdAt: string;
    User: {
        name: string;
        email: string;
        profileImage: string | null;
    } | null;
};

export function SuggestionManagementPanel({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Pengguna</th>
                                <th className="px-6 py-4 font-medium">Saran</th>
                                <th className="px-6 py-4 font-medium">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {initialSuggestions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                        Belum ada saran yang masuk.
                                    </td>
                                </tr>
                            ) : (
                                initialSuggestions.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-100">
                                                    {item.User?.profileImage ? (
                                                        <img src={item.User.profileImage} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-xs font-bold text-indigo-600">
                                                            {item.User?.name?.charAt(0) || "?"}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{item.User?.name || "Tanpa Nama"}</div>
                                                    <div className="text-xs text-slate-500">{item.User?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="max-w-xl text-slate-600">{item.suggestion}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {formatDate(item.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
