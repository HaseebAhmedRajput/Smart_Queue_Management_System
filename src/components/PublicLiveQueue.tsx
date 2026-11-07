// // 


// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Volume2,
//   Tv,
//   Clock,
//   RefreshCw,
// } from 'lucide-react';
// import { supabaseService } from '@/lib/supabase/service';
// import type { Floor, Shelf } from '../types/database';

// type PublicQueueToken = {
//   id: string;
//   display_number: string;
//   status: 'pending' | 'called' | 'working';
//   created_at: string;
//   called_at: string | null;
//   started_at: string | null;
//   completed_at: string | null;
//   service_id: string;
//   service_name: string | null;
//   service_code: string | null;
//   shelf_id: string | null;
//   shelf_name: string | null;
//   shelf_number: number | null;
//   shelf_is_paused: boolean | null;
//   floor_id: string | null;
//   floor_name: string | null;
//   floor_number: number | null;
// };

// export const PublicLiveQueue: React.FC = () => {
//   const [floors, setFloors] = useState<Floor[]>([]);
//   const [shelves, setShelves] = useState<Shelf[]>([]);
//   const [tokens, setTokens] = useState<PublicQueueToken[]>([]);
//   const [selectedFloorId, setSelectedFloorId] = useState('all');
//   const [liveAnnouncement, setLiveAnnouncement] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [refreshError, setRefreshError] = useState<string | null>(null);

//   const loadData = useCallback(async () => {
//     try {
//       const [flrData, shData, tokData] = await Promise.all([
//         supabaseService.getFloors(),
//         supabaseService.getShelves(),
//         supabaseService.getPublicLiveQueue(),
//       ]);

//       setFloors(flrData);
//       setShelves(shData);
//       setTokens(tokData as PublicQueueToken[]);
//       setLastUpdated(new Date());
//       setRefreshError(null);

//       const calledToken = (tokData as PublicQueueToken[]).find(
//         (token) => token.status === 'called'
//       );

//       if (calledToken) {
//         setLiveAnnouncement(
//           `Token ${calledToken.display_number} ➔ Please proceed to ${
//             calledToken.shelf_name || 'the assigned counter'
//           }`
//         );
//       } else {
//         setLiveAnnouncement(null);
//       }
//     } catch (err) {
//       console.error('[Public Live Queue] Failed to load:', err);
//       setRefreshError(
//         err instanceof Error ? err.message : 'Unable to load live queue.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();

//     // Public screens use polling because anonymous users cannot
//     // reliably receive token Postgres-change events under token RLS.
//     const interval = window.setInterval(() => {
//       loadData();
//     }, 5000);

//     return () => window.clearInterval(interval);
//   }, [loadData]);

//   const activeFloors = floors.filter((floor) => floor.is_active);

//   const displayedShelves = shelves.filter((shelf) => {
//     if (!shelf.is_active) return false;

//     if (
//       selectedFloorId !== 'all' &&
//       shelf.floor_id !== selectedFloorId
//     ) {
//       return false;
//     }

//     return true;
//   });

//   const pendingTokens = tokens
//     .filter((token) => token.status === 'pending')
//     .sort(
//       (a, b) =>
//         new Date(a.created_at).getTime() -
//         new Date(b.created_at).getTime()
//     );

//   if (loading) {
//     return (
//       <div className="p-12 text-center text-xs text-[#4A5B70] flex items-center justify-center gap-2">
//         <RefreshCw className="w-4 h-4 animate-spin text-[#648BB5]" />
//         <span>Loading Token Queues...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 animate-fade-in text-[#263445]">

//       {/* Header */}
//       <div className="p-6 rounded-2xl bg-[#172638] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-[#24364B]">
//         <div className="flex items-center gap-3.5">
//           <div className="p-3 rounded-xl bg-[#24364B] text-[#DCE8F5] border border-[#648BB5]/30">
//             <Tv className="w-7 h-7" />
//           </div>

//           <div>
//             <div className="flex items-center gap-2">
//               <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
//                 Public Token Queue
//               </h2>
//               <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
//             </div>

//             <p className="text-xs text-[#A4BFDD]">
//               {lastUpdated
//                 ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
//                 : 'Connecting to live queue...'}
//             </p>
//           </div>
//         </div>

//         {/* Floor filters */}
//         <div className="flex items-center gap-2 bg-[#24364B] p-1 rounded-xl border border-[#648BB5]/30 text-xs flex-wrap">
//           <button
//             onClick={() => setSelectedFloorId('all')}
//             className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
//               selectedFloorId === 'all'
//                 ? 'bg-[#172638] text-white shadow-xs'
//                 : 'text-[#A4BFDD] hover:text-white'
//             }`}
//           >
//             All Floors
//           </button>

//           {activeFloors.map((floor) => (
//             <button
//               key={floor.id}
//               onClick={() => setSelectedFloorId(floor.id)}
//               className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
//                 selectedFloorId === floor.id
//                   ? 'bg-[#172638] text-white shadow-xs'
//                   : 'text-[#A4BFDD] hover:text-white'
//               }`}
//             >
//               {floor.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Error */}
//       {refreshError && (
//         <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-3">
//           <span>Queue refresh failed: {refreshError}</span>
//           <button
//             onClick={loadData}
//             className="font-bold underline"
//           >
//             Retry
//           </button>
//         </div>
//       )}

//       {/* Announcement */}
//       {liveAnnouncement && (
//         <div className="p-4 rounded-xl bg-[#24364B] text-white flex items-center justify-between border-2 border-[#648BB5] shadow-md animate-pulse">
//           <div className="flex items-center gap-3">
//             <div className="p-2 rounded-lg bg-[#172638] text-[#DCE8F5]">
//               <Volume2 className="w-5 h-5 text-[#648BB5]" />
//             </div>

//             <div>
//               <span className="text-[10px] uppercase font-bold text-[#A4BFDD] tracking-wider block">
//                 Calling Announcement
//               </span>
//               <span className="text-sm sm:text-base font-extrabold text-white">
//                 {liveAnnouncement}
//               </span>
//             </div>
//           </div>

//           <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#172638] text-[#DCE8F5] border border-[#648BB5]/40 hidden sm:block">
//             120s Timer Active
//           </span>
//         </div>
//       )}

//       {/* Counter Stations */}
//       <div>
//         <div className="flex items-center justify-between mb-3 px-1">
//           <h3 className="text-xs uppercase font-extrabold text-[#718096] tracking-wider">
//             Counter Stations & Now Serving
//           </h3>

//           <span className="text-xs text-[#718096] font-semibold">
//             {displayedShelves.length} counters active
//           </span>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//           {displayedShelves.map((shelf) => {
//             const activeToken = tokens.find(
//               (token) =>
//                 token.shelf_id === shelf.id &&
//                 ['called', 'working'].includes(token.status)
//             );

//             const isCalled = activeToken?.status === 'called';
//             const isWorking = activeToken?.status === 'working';

//             const floorName =
//               floors.find((floor) => floor.id === shelf.floor_id)?.name ||
//               'Ground';

//             return (
//               <div
//                 key={shelf.id}
//                 className={`p-6 rounded-2xl border transition-all duration-300 ${
//                   isCalled
//                     ? 'bg-[#EFF6FF] border-[#2563EB] shadow-lg ring-2 ring-[#2563EB]/30 scale-[1.01]'
//                     : isWorking
//                     ? 'bg-white border-[#0284C7] shadow-sm'
//                     : 'bg-white border-[#E2E8F0] shadow-xs'
//                 }`}
//               >
//                 <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
//                   <div className="flex items-center gap-2">
//                     <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#24364B] text-white">
//                       #{shelf.shelf_number}
//                     </span>

//                     <h4 className="font-extrabold text-sm text-[#172638]">
//                       {shelf.name}
//                     </h4>
//                   </div>

//                   {shelf.is_paused ? (
//                     <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
//                       Paused
//                     </span>
//                   ) : activeToken ? (
//                     <span
//                       className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
//                         isCalled
//                           ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD] animate-pulse'
//                           : 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
//                       }`}
//                     >
//                       {isCalled ? 'CALLED' : 'WORKING'}
//                     </span>
//                   ) : (
//                     <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F1F5F9] text-[#64748B]">
//                       Ready
//                     </span>
//                   )}
//                 </div>

//                 <div className="py-6 text-center">
//                   {activeToken ? (
//                     <div>
//                       <span className="text-[11px] uppercase font-bold tracking-wider text-[#718096]">
//                         Ticket Number
//                       </span>

//                       <div className="text-4xl sm:text-5xl font-black text-[#172638] font-mono tracking-tight my-1">
//                         {activeToken.display_number}
//                       </div>

//                       <div className="text-xs font-semibold text-[#4A5B70]">
//                         {activeToken.service_name || 'General Service'}
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="py-2">
//                       <span className="text-2xl sm:text-3xl font-extrabold text-[#94A3B8] font-mono tracking-wider">
//                         — — —
//                       </span>

//                       <div className="text-xs text-[#94A3B8] mt-1 font-medium">
//                         Counter Standing By
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#718096]">
//                   <span>Floor: {floorName}</span>
//                   <span className="font-semibold text-[#24364B]">
//                     {activeToken ? 'Now Serving' : 'Available'}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Waiting Queue */}
//       <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
//         <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
//           <div className="flex items-center gap-2">
//             <Clock className="w-4 h-4 text-[#24364B]" />

//             <h3 className="font-bold text-sm text-[#172638] uppercase tracking-wider">
//               Upcoming In Queue (Next to be Called)
//             </h3>
//           </div>

//           <span className="text-xs text-[#718096] font-semibold">
//             {pendingTokens.length} waiting
//           </span>
//         </div>

//         {pendingTokens.length === 0 ? (
//           <p className="text-xs text-[#718096] text-center py-6">
//             All tickets have been dispatched. No citizens waiting in the queue.
//           </p>
//         ) : (
//           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
//             {pendingTokens.slice(0, 16).map((token, index) => (
//               <div
//                 key={token.id}
//                 className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-center space-y-1 hover:border-[#648BB5] transition-all"
//               >
//                 <span className="text-[10px] font-bold text-[#718096] block">
//                   #{index + 1}
//                 </span>

//                 <div className="text-lg font-black font-mono text-[#172638]">
//                   {token.display_number}
//                 </div>

//                 <span className="text-[10px] font-semibold text-[#1E3A8A] block truncate">
//                   {token.service_code || 'GEN'}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };




'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  Tv,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import type { Floor, Shelf } from '../types/database';

type PublicQueueToken = {
  id: string;
  display_number: string;
  status: 'pending' | 'called' | 'working';
  created_at: string;
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  service_id: string;
  service_name: string | null;
  service_code: string | null;
  shelf_id: string | null;
  shelf_name: string | null;
  shelf_number: number | null;
  shelf_is_paused: boolean | null;
  floor_id: string | null;
  floor_name: string | null;
  floor_number: number | null;
};

export const PublicLiveQueue: React.FC = () => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [tokens, setTokens] = useState<PublicQueueToken[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('all');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [flrData, shData, tokData] = await Promise.all([
        supabaseService.getFloors(),
        supabaseService.getShelves(),
        supabaseService.getPublicLiveQueue(),
      ]);

      setFloors(flrData);
      setShelves(shData);
      setTokens(tokData as PublicQueueToken[]);
      setLastUpdated(new Date());
      setRefreshError(null);

      const calledToken = (tokData as PublicQueueToken[]).find(
        (token) => token.status === 'called'
      );

      if (calledToken) {
        setLiveAnnouncement(
          `Token ${calledToken.display_number} ➔ Please proceed to ${
            calledToken.shelf_name || 'the assigned counter'
          }`
        );
      } else {
        setLiveAnnouncement(null);
      }
    } catch (err) {
      console.error('[Public Live Queue] Failed to load:', err);
      setRefreshError(
        err instanceof Error ? err.message : 'Unable to load live queue.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = window.setInterval(() => {
      loadData();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadData]);

  const activeFloors = floors.filter((floor) => floor.is_active);

  const displayedShelves = shelves.filter((shelf) => {
    if (!shelf.is_active) return false;

    if (
      selectedFloorId !== 'all' &&
      shelf.floor_id !== selectedFloorId
    ) {
      return false;
    }

    return true;
  });

  const pendingTokens = tokens
    .filter((token) => token.status === 'pending')
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#4A5B70] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#648BB5]" />
        <span>Loading Token Queues...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in text-[#263445]">

      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#172638] text-white flex flex-col gap-4 shadow-md border border-[#24364B]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-[#24364B] text-[#DCE8F5] border border-[#648BB5]/30 shrink-0">
              <Tv className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase">
                  Public Token Queue
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
              </div>

              <p className="text-[11px] sm:text-xs text-[#A4BFDD]">
                {lastUpdated
                  ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                  : 'Connecting to live queue...'}
              </p>
            </div>
          </div>
        </div>

        {/* Floor filters (Scrollable horizontally on mobile to prevent overflow) */}
        <div className="flex items-center gap-1.5 bg-[#24364B] p-1 rounded-xl border border-[#648BB5]/30 text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setSelectedFloorId('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
              selectedFloorId === 'all'
                ? 'bg-[#172638] text-white shadow-xs'
                : 'text-[#A4BFDD] hover:text-white'
            }`}
          >
            All Floors
          </button>

          {activeFloors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloorId(floor.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                selectedFloorId === floor.id
                  ? 'bg-[#172638] text-white shadow-xs'
                  : 'text-[#A4BFDD] hover:text-white'
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {refreshError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-3">
          <span>Queue refresh failed: {refreshError}</span>
          <button
            onClick={loadData}
            className="font-bold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Announcement */}
      {liveAnnouncement && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#24364B] text-white flex items-center justify-between border-2 border-[#648BB5] shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#172638] text-[#DCE8F5] shrink-0">
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#648BB5]" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#A4BFDD] tracking-wider block">
                Calling Announcement
              </span>
              <span className="text-xs sm:text-base font-extrabold text-white leading-snug">
                {liveAnnouncement}
              </span>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#172638] text-[#DCE8F5] border border-[#648BB5]/40 hidden sm:block shrink-0">
            120s Timer Active
          </span>
        </div>
      )}

      {/* Counter Stations */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-extrabold text-[#718096] tracking-wider">
            Counter Stations & Now Serving
          </h3>

          <span className="text-xs text-[#718096] font-semibold">
            {displayedShelves.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedShelves.map((shelf) => {
            const activeToken = tokens.find(
              (token) =>
                token.shelf_id === shelf.id &&
                ['called', 'working'].includes(token.status)
            );

            const isCalled = activeToken?.status === 'called';
            const isWorking = activeToken?.status === 'working';

            const floorName =
              floors.find((floor) => floor.id === shelf.floor_id)?.name ||
              'Ground';

            return (
              <div
                key={shelf.id}
                className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${
                  isCalled
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-lg ring-2 ring-[#2563EB]/30 scale-[1.01]'
                    : isWorking
                    ? 'bg-white border-[#0284C7] shadow-sm'
                    : 'bg-white border-[#E2E8F0] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#24364B] text-white">
                      #{shelf.shelf_number}
                    </span>

                    <h4 className="font-extrabold text-sm text-[#172638] truncate max-w-[150px] sm:max-w-[180px]">
                      {shelf.name}
                    </h4>
                  </div>

                  {shelf.is_paused ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] shrink-0">
                      Paused
                    </span>
                  ) : activeToken ? (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        isCalled
                          ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD] animate-pulse'
                          : 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                      }`}
                    >
                      {isCalled ? 'CALLED' : 'WORKING'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F1F5F9] text-[#64748B] shrink-0">
                      Ready
                    </span>
                  )}
                </div>

                <div className="py-4 sm:py-6 text-center">
                  {activeToken ? (
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider text-[#718096]">
                        Ticket Number
                      </span>

                      <div className="text-3xl sm:text-5xl font-black text-[#172638] font-mono tracking-tight my-1">
                        {activeToken.display_number}
                      </div>

                      <div className="text-xs font-semibold text-[#4A5B70] truncate px-2">
                        {activeToken.service_name || 'General Service'}
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#94A3B8] font-mono tracking-wider">
                        — — —
                      </span>

                      <div className="text-xs text-[#94A3B8] mt-1 font-medium">
                        Counter Standing By
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#718096]">
                  <span>Floor: {floorName}</span>
                  <span className="font-semibold text-[#24364B]">
                    {activeToken ? 'Now Serving' : 'Available'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waiting Queue */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#24364B]" />

            <h3 className="font-bold text-xs sm:text-sm text-[#172638] uppercase tracking-wider">
              Upcoming In Queue (Next to be Called)
            </h3>
          </div>

          <span className="text-xs text-[#718096] font-semibold shrink-0">
            {pendingTokens.length} waiting
          </span>
        </div>

        {pendingTokens.length === 0 ? (
          <p className="text-xs text-[#718096] text-center py-6">
            All tickets have been dispatched. No citizens waiting in the queue.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
            {pendingTokens.slice(0, 16).map((token, index) => (
              <div
                key={token.id}
                className="p-2.5 sm:p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-center space-y-1 hover:border-[#648BB5] transition-all"
              >
                <span className="text-[10px] font-bold text-[#718096] block">
                  #{index + 1}
                </span>

                <div className="text-base sm:text-lg font-black font-mono text-[#172638]">
                  {token.display_number}
                </div>

                <span className="text-[10px] font-semibold text-[#1E3A8A] block truncate">
                  {token.service_code || 'GEN'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};