export function PatientRecordSkeleton() {
    return (
        <div className="mb-4 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />

            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50">
                    <div className="w-[60px] h-[60px] rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-40 bg-gray-200 rounded" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                        <div className="flex gap-4">
                            <div className="h-3.5 w-20 bg-gray-200 rounded" />
                            <div className="h-3.5 w-28 bg-gray-200 rounded" />
                            <div className="h-3.5 w-24 bg-gray-200 rounded" />
                            <div className="h-3.5 w-32 bg-gray-200 rounded" />
                        </div>
                        <div className="h-3.5 w-48 bg-gray-200 rounded" />
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                    </div>
                </div>

                <div className="bg-gray-100 border-t border-gray-200 flex">
                    <div className="px-5 py-2">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="px-5 py-2">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl overflow-hidden mt-4 mb-4">
                <div className="flex divide-x divide-gray-200">
                    <div className="flex-1 px-4 py-3 bg-gray-50 space-y-2">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                    </div>
                    <div className="flex-1 px-4 py-3 space-y-2">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
