(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/components/JobCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JobCard",
    ()=>JobCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/helpers.ts [app-client] (ecmascript)");
'use client';
;
;
const JobCard = ({ job, jigA, onClick })=>{
    const jigs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jigsOf"])(job.id, jigA);
    const badge = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stageBadge"])(job, jigA);
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stageLabel"])(job, jigA);
    const badgeColors = {
        'b-intake': 'bg-gray-100 text-gray-700',
        'b-jig': 'bg-emerald-100 text-emerald-900',
        'b-dispatch': 'bg-blue-100 text-blue-900',
        'b-done': 'bg-green-100 text-green-900'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: onClick,
        className: `bg-white border rounded-xl p-3.5 mb-2.5 cursor-pointer transition-colors active:border-primary ${label === 'Ready to dispatch' ? 'border-l-4 border-primary' : 'border-gray-200'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between gap-2 mb-1",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "font-bold text-[15px]",
                    children: job.po_number
                }, void 0, false, {
                    fileName: "[project]/app/components/JobCard.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/app/components/JobCard.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[13px] text-gray-600 mb-1",
                children: job.customer_name
            }, void 0, false, {
                fileName: "[project]/app/components/JobCard.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-1.5 flex-wrap mt-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeColors[badge] || 'bg-gray-100 text-gray-700'}`,
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobCard.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    job.plating === 'gold' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800",
                        children: "Gold"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobCard.tsx",
                        lineNumber: 41,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    job.urgent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800",
                        children: "Urgent"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobCard.tsx",
                        lineNumber: 46,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    job.isInternal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800",
                        children: "Internal"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobCard.tsx",
                        lineNumber: 51,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/JobCard.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            jigs.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[12px] text-gray-500 mt-1.5 flex items-center gap-1 flex-wrap",
                children: jigs.map((g)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `inline-block w-2 h-2 rounded-full ${g.completedAt ? 'bg-primary' : 'bg-yellow-400'}`
                    }, g.id, false, {
                        fileName: "[project]/app/components/JobCard.tsx",
                        lineNumber: 60,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/app/components/JobCard.tsx",
                lineNumber: 58,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/JobCard.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = JobCard;
var _c;
__turbopack_context__.k.register(_c, "JobCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/EmptyState.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EmptyState",
    ()=>EmptyState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
const EmptyState = ({ icon, title, message })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center py-12 px-5 text-gray-500",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[44px] mb-3",
                children: icon
            }, void 0, false, {
                fileName: "[project]/app/components/EmptyState.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-base font-semibold text-gray-700 mb-1.5",
                children: title
            }, void 0, false, {
                fileName: "[project]/app/components/EmptyState.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-sm",
                children: message
            }, void 0, false, {
                fileName: "[project]/app/components/EmptyState.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/EmptyState.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = EmptyState;
var _c;
__turbopack_context__.k.register(_c, "EmptyState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/JobsView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JobsView",
    ()=>JobsView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$JobCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/JobCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/EmptyState.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/helpers.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const JobsView = ({ jobs, jigA, onJobClick })=>{
    _s();
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateFrom, setDateFrom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateTo, setDateTo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateMode, setDateMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("created");
    const handleClear = ()=>{
        setSearchTerm("");
        setDateFrom("");
        setDateTo("");
    };
    const hasActiveFilters = searchTerm || dateFrom || dateTo;
    const filtered = jobs.filter((j)=>{
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            // Search across PO, customer, part codes, and descriptions
            const matchesPO = j.po_number.toLowerCase().includes(term);
            const matchesCustomer = j.customer_name.toLowerCase().includes(term);
            const matchesParts = j.parts.some((p)=>p.code.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term));
            if (!matchesPO && !matchesCustomer && !matchesParts) {
                return false;
            }
        }
        // Filter by date based on selected mode
        const dateToCheck = dateMode === "created" ? j.createdAt : j.dispatchedAt || 0;
        if (dateFrom && dateToCheck < new Date(dateFrom).getTime()) return false;
        if (dateTo && dateToCheck > new Date(dateTo).getTime() + 86400000) return false;
        return true;
    });
    const ready = filtered.filter((j)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isReady"])(j, jigA) && !j.dispatchedAt);
    const wip = filtered.filter((j)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isReady"])(j, jigA) && !j.dispatchedAt && jigA.some((g)=>g.jobId === j.id));
    const intake = filtered.filter((j)=>!j.dispatchedAt && !jigA.some((g)=>g.jobId === j.id));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    placeholder: "🔍 Search PO, customer, part code, description.",
                    value: searchTerm,
                    onChange: (e)=>setSearchTerm(e.target.value),
                    className: "w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
                }, void 0, false, {
                    fileName: "[project]/app/components/JobsView.tsx",
                    lineNumber: 73,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: dateFrom,
                        onChange: (e)=>setDateFrom(e.target.value),
                        placeholder: "dd/mm/yyyy",
                        className: "flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex items-center text-gray-400 text-sm",
                        children: "to"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: dateTo,
                        onChange: (e)=>setDateTo(e.target.value),
                        placeholder: "dd/mm/yyyy",
                        className: "flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 91,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleClear,
                        className: "px-4 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                        children: "Clear"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setDateMode("created"),
                        className: `flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${dateMode === "created" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                        children: "Date created"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 107,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setDateMode("dispatched"),
                        className: `flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${dateMode === "dispatched" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                        children: "Date dispatched"
                    }, void 0, false, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 106,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            ready.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5",
                        children: [
                            "Ready to Dispatch (",
                            ready.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 131,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    ready.map((j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$JobCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JobCard"], {
                            job: j,
                            jigA: jigA,
                            onClick: ()=>onJobClick(j)
                        }, j.id, false, {
                            fileName: "[project]/app/components/JobsView.tsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 130,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            wip.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5",
                        children: [
                            "Work in Progress (",
                            wip.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 147,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    wip.map((j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$JobCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JobCard"], {
                            job: j,
                            jigA: jigA,
                            onClick: ()=>onJobClick(j)
                        }, j.id, false, {
                            fileName: "[project]/app/components/JobsView.tsx",
                            lineNumber: 151,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 146,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            intake.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5",
                        children: [
                            "Intake (",
                            intake.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/JobsView.tsx",
                        lineNumber: 163,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    intake.map((j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$JobCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JobCard"], {
                            job: j,
                            jigA: jigA,
                            onClick: ()=>onJobClick(j)
                        }, j.id, false, {
                            fileName: "[project]/app/components/JobsView.tsx",
                            lineNumber: 167,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 162,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            jobs.length === 0 && searchTerm.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
                icon: "🔍",
                title: "No jobs yet",
                message: "Create your first job in the New Job tab"
            }, void 0, false, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 178,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            jobs.length === 0 && filtered.length === 0 && hasActiveFilters && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
                icon: "🤷",
                title: "No results",
                message: "Nothing matched your search or date range"
            }, void 0, false, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 186,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            jobs.length > 0 && !hasActiveFilters && ready.length === 0 && wip.length === 0 && intake.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
                icon: "🔍",
                title: "Search all jobs",
                message: "Type a PO number, customer name, part code or description — or pick a date range above"
            }, void 0, false, {
                fileName: "[project]/app/components/JobsView.tsx",
                lineNumber: 198,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/JobsView.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(JobsView, "4nP/HUejTxfZR+3IZoretMI8Wt4=");
_c = JobsView;
var _c;
__turbopack_context__.k.register(_c, "JobsView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/jobs/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>JobsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$context$2f$AppContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/context/AppContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$JobsView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/JobsView.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function JobsPage() {
    _s();
    const { jobs, jigA, handleJobClick } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$context$2f$AppContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$JobsView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JobsView"], {
        jobs: jobs,
        jigA: jigA,
        onJobClick: handleJobClick
    }, void 0, false, {
        fileName: "[project]/app/jobs/page.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_s(JobsPage, "PV/A+YwycQvkNNYuFnSRjE1Ytec=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$context$2f$AppContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"]
    ];
});
_c = JobsPage;
var _c;
__turbopack_context__.k.register(_c, "JobsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_12r3uj~._.js.map