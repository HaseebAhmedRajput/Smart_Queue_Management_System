'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Building2,
  Layers,
  Settings,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Shield,
  FileText,
  Activity,
  History,
  TrendingUp,
  ChevronRight,
  Filter,
  RefreshCw,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { supabaseService } from '../lib/supabase/service';
import type {
  Floor,
  Shelf,
  Service,
  Profile,
  TokenWithDetails,
  TokenEvent,
  UserRole,
} from '../types/database';
import { theme, getStatusBadge, getRoleBadge, formatDuration, formatTimeAgo } from '../styles/theme';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'tokens' | 'resources' | 'services' | 'users'>(
    'analytics'
  );

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({
    totalTokens: 0,
    activeQueue: 0,
    completedToday: 0,
    rejectedCount: 0,
    noShowCount: 0,
    avgWaitSeconds: 0,
    avgServiceSeconds: 0,
    statusBreakdown: [],
    serviceVolume: [],
  });

  const [allTokens, setAllTokens] = useState<TokenWithDetails[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileView, setProfileView] = useState<'users' | 'staff'>('users');

  // Search & Filter state for tokens table
  const [tokenSearch, setTokenSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [shelfFilter, setShelfFilter] = useState<string>('all');

  // Resource creation states
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorNumber, setNewFloorNumber] = useState(1);
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfFloorId, setNewShelfFloorId] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCode, setNewServiceCode] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState("Est. Minutes");
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Edit mode reuses the same forms: clicking Edit fills these fields.
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [floorDescription, setFloorDescription] = useState('');
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [newShelfNumber, setNewShelfNumber] = useState(1);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [shelfServiceDrafts, setShelfServiceDrafts] = useState<Record<string, { all: boolean; ids: string[] }>>({});
  const [savingShelfServicesId, setSavingShelfServicesId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [anData, tokData, flrData, shData, svcData, prfData] = await Promise.all([
        supabaseService.getAnalytics(),
        supabaseService.getAllTokensDetailed(),
        supabaseService.getFloors(),
        supabaseService.getShelves(),
        supabaseService.getAllServices(),
        supabaseService.getProfiles(),
      ]);

      setAnalytics(anData);
      setAllTokens(tokData);
      setFloors(flrData);
      setShelves(shData);
      setServices(svcData);
      setProfiles(prfData);

      if (flrData.length > 0 && !newShelfFloorId) {
        setNewShelfFloorId(flrData[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [newShelfFloorId]);

  useEffect(() => {
    loadData();
    const unsub = supabaseService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [loadData]);

  // Filtered tokens
  const filteredTokens = allTokens.filter((tok) => {
    const matchesSearch =
      tokenSearch === '' ||
      tok.display_number.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      tok.applicant?.full_name?.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      tok.applicant?.national_id_or_passport?.toLowerCase().includes(tokenSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tok.status === statusFilter;
    const matchesService = serviceFilter === 'all' || tok.service_id === serviceFilter;
    const matchesShelf = shelfFilter === 'all' || tok.shelf_id === shelfFilter;

    return matchesSearch && matchesStatus && matchesService && matchesShelf;
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await supabaseService.updateProfileRole(userId, newRole);
    if (res.error) {
      alert(res.error);
    } else {
      await loadData();
    }
  };

  const handleAssignShelf = async (profileId: string, shelfId: string) => {
    const res = await supabaseService.assignShelfToOfficer(profileId, shelfId || null);
    if (res.error) {
      alert(res.error);
    } else {
      await loadData();
    }
  };

  const startEditFloor = (floor: Floor) => {
    setEditingFloorId(floor.id);
    setNewFloorName(floor.name);
    setNewFloorNumber(floor.floor_number);
    setFloorDescription(floor.description || '');
  };

  const cancelEditFloor = () => {
    setEditingFloorId(null);
    setNewFloorName('');
    setNewFloorNumber(Math.max(1, ...floors.map((floor) => floor.floor_number + 1)));
    setFloorDescription('');
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFloorName.trim();
    const number = Number(newFloorNumber);
    if (!name || !Number.isInteger(number) || number < 0) {
      alert('Please enter a valid floor name and floor number.');
      return;
    }

    const res = editingFloorId
      ? await supabaseService.updateFloor(editingFloorId, {
          name, floor_number: number, description: floorDescription.trim(),
        })
      : await supabaseService.createFloor({
          name, floor_number: number,
          description: floorDescription.trim() || 'Administrative floor area',
          is_active: true,
        });

    if (res.error) {
      alert(res.error);
    } else {
      cancelEditFloor();
      await loadData();
    }
  };

  const handleToggleFloor = async (id: string, currentState: boolean) => {
    const res = await supabaseService.updateFloor(id, { is_active: !currentState });
    if (res.error) {
      alert(res.error);
    } else {
      await loadData();
    }
  };

  const startEditShelf = (shelf: Shelf) => {
    setEditingShelfId(shelf.id);
    setNewShelfName(shelf.name);
    setNewShelfNumber(shelf.shelf_number);
    setNewShelfFloorId(shelf.floor_id);
  };

  const cancelEditShelf = () => {
    setEditingShelfId(null);
    setNewShelfName('');
    setNewShelfNumber(Math.max(1, ...shelves.map((shelf) => shelf.shelf_number + 1)));
    if (floors.length > 0) setNewShelfFloorId(floors[0].id);
  };

  const handleAddShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newShelfName.trim();
    const number = Number(newShelfNumber);
    if (!name || !newShelfFloorId || !Number.isInteger(number) || number < 1) {
      alert('Please enter a counter name, valid counter number, and floor.');
      return;
    }

    const res = editingShelfId
      ? await supabaseService.updateShelf(editingShelfId, {
          name, shelf_number: number, floor_id: newShelfFloorId,
        })
      : await supabaseService.createShelf({
          floor_id: newShelfFloorId,
          name,
          shelf_number: number,
          service_ids: services.filter((service) => service.is_active).map((service) => service.id),
          is_active: true,
          is_paused: false,
        });

    if (res.error) {
      alert(res.error);
    } else {
      cancelEditShelf();
      await loadData();
    }
  };

  const handleToggleShelf = async (id: string, currentState: boolean) => {
    const res = await supabaseService.updateShelf(id, { is_active: !currentState });
    if (res.error) {
      alert(res.error);
    } else {
      await loadData();
    }
  };

  const handleToggleShelfPause = async (id: string, currentPause: boolean) => {
    const res = await supabaseService.updateShelf(id, { is_paused: !currentPause });
    if (res.error) {
      alert(res.error);
    } else {
      await loadData();
    }
  };

  const handleSaveShelfServices = async (shelf: Shelf) => {
    const currentDraft = shelfServiceDrafts[shelf.id] ?? {
      all: !shelf.service_ids || shelf.service_ids.length === 0,
      ids: shelf.service_ids || [],
    };

    if (!currentDraft.all && currentDraft.ids.length === 0) {
      alert('Select at least one service, or choose All services.');
      return;
    }

    setSavingShelfServicesId(shelf.id);
    const res = await supabaseService.updateShelf(shelf.id, {
      // In the dispatch SQL, an empty service_ids array means all services.
      service_ids: currentDraft.all ? [] : Array.from(new Set(currentDraft.ids)),
    });
    setSavingShelfServicesId(null);

    if (res.error) {
      alert(`Could not update services for ${shelf.name}: ${res.error}`);
      return;
    }

    setShelfServiceDrafts((prev) => ({
      ...prev,
      [shelf.id]: { all: currentDraft.all, ids: currentDraft.all ? [] : Array.from(new Set(currentDraft.ids)) },
    }));
    await loadData();
    alert(`Services updated for ${shelf.name}.`);
  };

  const startEditService = (service: Service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNewServiceCode(service.code);
    setNewServiceDuration(service.estimated_duration_minutes as any);
    setNewServiceDesc(service.description || '');
  };

  const cancelEditService = () => {
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServiceCode('');
    setNewServiceDuration(15 as any);
    setNewServiceDesc('');
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newServiceName.trim();
    const code = newServiceCode.trim().toUpperCase();
    const duration = Number(newServiceDuration);
    if (!name || !code || !Number.isInteger(duration) || duration < 1) {
      alert('Please enter a service name, code, and duration of at least 1 minute.');
      return;
    }

    if (editingServiceId) {
      const res = await supabaseService.updateService(editingServiceId, {
        name, code, description: newServiceDesc.trim(),
        estimated_duration_minutes: duration,
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      cancelEditService();
      await loadData();
      return;
    }

    const res = await supabaseService.createService({
      name, code,
      description: newServiceDesc.trim() || 'Government public service',
      estimated_duration_minutes: duration,
      is_active: true,
    });
    if (res.error) {
      alert(res.error);
      return;
    }

    // Newly created services are not automatically assigned to every counter.
    // The admin can assign the service explicitly in Floors & Counters.
    cancelEditService();
    await loadData();
  };

  const handleToggleService = async (id: string, currentState: boolean) => {
    const res = await supabaseService.updateService(id, { is_active: !currentState });
    if (res.error) {
      alert(res.error);
    } else {
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#475569] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#10B981]" />
        <span>Loading administrator console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#0F172D]">
      {/* Admin Tab Header Navigation */}
      <div className="bg-white border border-[#E2E8F0] p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tokens'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            Queue Monitor ({allTokens.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            Floors & Counters ({shelves.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            Services  ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            Staff & Permissions ({profiles.length})
          </button>
        </div>

        <button
          onClick={() => loadData()}
          className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-xs font-bold text-[#475569] flex items-center gap-1.5 cursor-pointer transition-all mr-1"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: EXECUTIVE ANALYTICS */}
      {/* ============================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                Total Intake
              </span>
              <div className="text-2xl font-black text-[#047857] mt-1">
                {analytics.totalTokens}
              </div>
              <span className="text-[10px] text-[#10B981] font-semibold">Today&apos;s records</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                Active Queue
              </span>
              <div className="text-2xl font-black text-[#047857] mt-1">
                {analytics.activeQueue}
              </div>
              <span className="text-[10px] text-[#047857] font-semibold">Pending / Called / Work</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                Completed
              </span>
              <div className="text-2xl font-black text-[#059669] mt-1">
                {analytics.completedToday}
              </div>
              <span className="text-[10px] text-[#059669] font-semibold">Successful</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                No-Show Skips
              </span>
              <div className="text-2xl font-black text-[#4B5563] mt-1">
                {analytics.noShowCount}
              </div>
              <span className="text-[10px] text-[#4B5563] font-semibold">&gt;120s timer</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                Avg Wait Time
              </span>
              <div className="text-2xl font-black text-[#D97706] mt-1">
                {formatDuration(analytics.avgWaitSeconds)}
              </div>
              <span className="text-[10px] text-[#D97706] font-semibold">Ticket to counter</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                Avg Service Time
              </span>
              <div className="text-2xl font-black text-[#0D9488] mt-1">
                {formatDuration(analytics.avgServiceSeconds)}
              </div>
              <span className="text-[10px] text-[#0D9488] font-semibold">Counter processing</span>
            </div>
          </div>

          {/* Recharts Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Pie Chart */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <h4 className="font-bold text-sm text-[#047857] mb-1">
                Ticket Lifecycle & Status Distribution
              </h4>
              <p className="text-xs text-[#64748B] mb-4">
                Real-time operational distribution across all processing stages
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {analytics.statusBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} tickets`, name]}
                      contentStyle={{
                        backgroundColor: '#047857',
                        borderColor: '#10B981',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Volume Bar Chart */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <h4 className="font-bold text-sm text-[#047857] mb-1">
                Intake Volume by Service Type
              </h4>
              <p className="text-xs text-[#64748B] mb-4">
                Citizen tickets categorized by government department service
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.serviceVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} tickets`, 'Volume']}
                      contentStyle={{
                        backgroundColor: '#047857',
                        borderColor: '#10B981',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: UNIVERSAL TOKENS QUEUE MONITOR */}
      {/* ============================================================== */}
      {activeTab === 'tokens' && (
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h4 className="font-bold text-base text-[#047857]">System Queue Monitor</h4>
              <p className="text-xs text-[#64748B]">
                Real-time tracking of all tickets across all service floors and counter shelves
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket, name, NID..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#10B981]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="called">Called</option>
              <option value="working">Working</option>
              <option value="successful">Successful</option>
              <option value="rejected">Rejected</option>
              <option value="skipped">Skipped (No-Show)</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#10B981]"
            >
              <option value="all">All Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={shelfFilter}
              onChange={(e) => setShelfFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#10B981]"
            >
              <option value="all">All Counter Stations</option>
              {shelves.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.name}
                </option>
              ))}
            </select>

            <span className="ml-auto text-xs font-semibold text-[#64748B] self-center">
              Showing {filteredTokens.length} of {allTokens.length} tickets
            </span>
          </div>

          {/* Tokens Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">Ticket #</th>
                  <th className="pb-2.5 font-bold">Applicant</th>
                  <th className="pb-2.5 font-bold">Service</th>
                  <th className="pb-2.5 font-bold">Counter</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold">Wait / Service</th>
                  <th className="pb-2.5 font-bold">Intake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/60">
                {filteredTokens.map((tok) => {
                  const badge = getStatusBadge(tok.status);
                  return (
                    <tr key={tok.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 font-bold font-mono text-[#047857]">
                        {tok.display_number}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-[#10B981]">{tok.applicant?.full_name}</div>
                        <div className="text-[11px] text-[#64748B]">{tok.applicant?.national_id_or_passport}</div>
                      </td>
                      <td className="py-3 text-[#475569]">{tok.service?.name}</td>
                      <td className="py-3 font-semibold text-[#047857]">
                        {tok.shelf ? tok.shelf.name : '—'}
                      </td>
                      <td className="py-3">
                        <span className={badge.className}>
                          <span className={badge.dotClassName} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 text-[#64748B]">
                        {tok.created_at ? formatTimeAgo(tok.created_at) : '—'}
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#E2E8F0] text-[#10B981]">
                          {tok.is_walk_in ? 'WALK-IN' : 'PORTAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: FLOORS & COUNTERS MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Floors Section */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h4 className="font-bold text-base text-[#047857] pb-2 border-b border-[#E2E8F0]">
              Facility Floors ({floors.length})
            </h4>

            <form onSubmit={handleAddFloor} className="flex flex-wrap gap-2 rounded-xl bg-[#ECFDF5] p-3">
              <input
                type="text"
                placeholder="New Floor Name (e.g. 2nd Floor Visas)"
                required
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
              />
              <input
                type="number"
                placeholder="Floor #"
                min={0}
                required
                value={newFloorNumber}
                onChange={(e) => setNewFloorNumber(Number(e.target.value))}
                className="w-20 px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
              />
              <input
                type="text"
                placeholder="Floor description"
                value={floorDescription}
                onChange={(e) => setFloorDescription(e.target.value)}
                className="min-w-40 flex-1 px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#10B981] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {editingFloorId ? 'Save Floor' : 'Add Floor'}
              </button>
              {editingFloorId && <button type="button" onClick={cancelEditFloor} className="px-3 py-2 border border-[#CBD5E1] bg-white text-[#475569] text-xs font-bold rounded-xl">Cancel</button>}
            </form>

            <div className="space-y-2.5">
              {floors.map((flr) => (
                <div
                  key={flr.id}
                  className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#10B981]">{flr.name}</span>
                    <div className="text-[11px] text-[#64748B]">Level {flr.floor_number}</div>
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditFloor(flr)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#A7F3D0] bg-white text-[#047857] hover:bg-[#ECFDF5]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleFloor(flr.id, flr.is_active)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                      flr.is_active
                        ? 'bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]'
                        : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                    }`}
                  >
                    {flr.is_active ? 'Active' : 'Disabled'}
                  </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Counter Shelves Section */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h4 className="font-bold text-base text-[#047857] pb-2 border-b border-[#E2E8F0]">
              Operating Counter Stations ({shelves.length})
            </h4>

            <form onSubmit={handleAddShelf} className="flex flex-col sm:flex-row flex-wrap gap-2 rounded-xl bg-[#ECFDF5] p-3">
              <input
                type="text"
                placeholder="Counter Name (e.g. Counter 07 - Expedited)"
                required
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
              />
              <input
                type="number"
                min={1}
                required
                aria-label="Counter number"
                placeholder="Counter #"
                value={newShelfNumber}
                onChange={(e) => setNewShelfNumber(Number(e.target.value))}
                className="w-24 px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white"
              />
              <select
                required
                value={newShelfFloorId}
                onChange={(e) => setNewShelfFloorId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
              >
                {floors.map((flr) => (
                  <option key={flr.id} value={flr.id}>
                    {flr.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-[#10B981] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {editingShelfId ? 'Save Counter' : 'Add Station'}
              </button>
              {editingShelfId && <button type="button" onClick={cancelEditShelf} className="px-3 py-2 border border-[#CBD5E1] bg-white text-[#475569] text-xs font-bold rounded-xl">Cancel</button>}
            </form>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
              {shelves.map((sh) => (
                <div
                  key={sh.id}
                 className="w-full min-w-0 p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-4 text-xs xl:flex-row xl:items-start xl:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#047857]">
                      {sh.name} (#{sh.shelf_number})
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Supports: {!sh.service_ids || sh.service_ids.length === 0 ? 'All active services' : `${sh.service_ids.length} service(s)`}
                    </div>
                    {(() => {
                      const draft = shelfServiceDrafts[sh.id] ?? {
                        all: !sh.service_ids || sh.service_ids.length === 0,
                        ids: sh.service_ids || [],
                      };
                     return (
  <div className="mt-3 w-full min-w-0 max-w-none rounded-xl border border-[#D1FAE5] bg-white p-3 sm:p-4">
    {/* Header */}
    <div className="mb-3 flex flex-col gap-3 border-b border-[#E2E8F0] pb-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-bold text-[#047857]">
        Services handled by this counter
      </span>

      <label className="flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-xs font-semibold text-[#047857]">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0 accent-[#047857]"
          checked={draft.all}
          onChange={(e) =>
            setShelfServiceDrafts((prev) => ({
              ...prev,
              [sh.id]: {
                all: e.target.checked,
                ids: e.target.checked
                  ? []
                  : (prev[sh.id]?.ids ?? sh.service_ids ?? []),
              },
            }))
          }
        />
        <span>All services</span>
      </label>
    </div>

    {/* Services grid */}
    <div className="grid w-full min-w-0 grid-cols-1 gap-2 xl:grid-cols-2">
      {services.map((service) => (
        <label
          key={service.id}
          className={`flex min-w-0 cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-xs transition-colors ${
            draft.all
              ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]'
              : draft.ids.includes(service.id)
                ? 'border-[#6EE7B7] bg-[#ECFDF5] text-[#065F46]'
                : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#A7F3D0]'
          }`}
        >
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#047857]"
            disabled={
              draft.all ||
              (!service.is_active && !draft.ids.includes(service.id))
            }
            checked={draft.all || draft.ids.includes(service.id)}
            onChange={(e) =>
              setShelfServiceDrafts((prev) => {
                const current = prev[sh.id] ?? {
                  all: !sh.service_ids || sh.service_ids.length === 0,
                  ids: sh.service_ids || [],
                };

                const ids = e.target.checked
                  ? [...current.ids, service.id]
                  : current.ids.filter((id) => id !== service.id);

                return {
                  ...prev,
                  [sh.id]: {
                    all: false,
                    ids: Array.from(new Set(ids)),
                  },
                };
              })
            }
          />

          <span className="min-w-0 flex-1 break-words">
            <span className="block font-semibold leading-5 [overflow-wrap:anywhere]">
              {service.name}
            </span>

            <span className="mt-1 block text-[10px] leading-4 opacity-75">
              {service.code}
              {!service.is_active ? ' · Inactive' : ''}
            </span>
          </span>
        </label>
      ))}
    </div>

    {/* Footer */}
    <div className="mt-3 flex flex-col gap-3 border-t border-[#E2E8F0] pt-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[11px] leading-5 text-[#64748B]">
        {draft.all
          ? 'This counter can handle every active service, including future services.'
          : `${draft.ids.length} service(s) selected`}
      </span>

      <button
        type="button"
        disabled={savingShelfServicesId === sh.id}
        onClick={() => handleSaveShelfServices(sh)}
        className="w-full rounded-lg bg-[#047857] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#065F46] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:shrink-0"
      >
        {savingShelfServicesId === sh.id
          ? 'Saving…'
          : 'Save Services'}
      </button>
    </div>
  </div>
);
                    })()}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => startEditShelf(sh)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#A7F3D0] bg-white text-[#047857] hover:bg-[#ECFDF5]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleShelfPause(sh.id, sh.is_paused)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                        sh.is_paused
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
                          : 'bg-white text-[#475569] border-[#E2E8F0]'
                      }`}
                    >
                      {sh.is_paused ? 'Paused' : 'Operating'}
                    </button>
                    <button
                      onClick={() => handleToggleShelf(sh.id, sh.is_active)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                        sh.is_active
                          ? 'bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]'
                          : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                      }`}
                    >
                      {sh.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    {/* ============================================================== */}
      {/* TAB 4: SERVICES CATALOG */}
      {/* ============================================================== */}
      {activeTab === 'services' && (
        <div className="w-full min-w-0 p-3 sm:p-4 lg:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <h4 className="font-bold text-base text-[#047857] pb-3 border-b border-[#E2E8F0]">
            Government Services Configuration
          </h4>

          <form
            onSubmit={handleAddService}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 rounded-xl bg-[#ECFDF5] p-3 sm:p-4"
          >
            <input
              type="text"
              placeholder="Service Name"
              required
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="w-full min-w-0 px-3 py-2.5 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none focus:border-[#10B981]"
            />

            <input
              type="text"
              placeholder="Code"
              required
              value={newServiceCode}
              onChange={(e) => setNewServiceCode(e.target.value)}
              className="w-full min-w-0 px-3 py-2.5 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none focus:border-[#10B981]"
            />

            <input
              type="number"
              placeholder="Est. Minutes"
              required
              min="1"
              value={newServiceDuration}
              onChange={(e) =>
                setNewServiceDuration(Number(e.target.value) as any)
              }
              className="w-full min-w-0 px-3 py-2.5 text-sm rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none focus:border-[#10B981]"
            />

            <input
              type="text"
              placeholder="Service description"
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              className="w-full min-w-0 px-3 py-2.5 text-sm rounded-xl border border-[#E2E8F0] bg-white outline-none focus:border-[#10B981]"
            />

            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-[#10B981] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                {editingServiceId ? 'Save Service' : 'Add Service'}
              </button>

              {editingServiceId && (
                <button
                  type="button"
                  onClick={cancelEditService}
                  className="px-3 py-2.5 border border-[#CBD5E1] bg-white text-[#475569] text-xs font-bold rounded-xl hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-[#F8FAFC]">
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px]">
                  <th className="px-3 sm:px-4 py-3 font-bold">Code</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">Service Name</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">Duration</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">Description</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">Status / Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0]/60">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-3 sm:px-4 py-3 font-bold font-mono text-[#047857] whitespace-nowrap">
                      [{s.code}]
                    </td>

                    <td className="px-3 sm:px-4 py-3 font-semibold text-[#047857] min-w-[140px]">
                      {s.name}
                    </td>

                    <td className="px-3 sm:px-4 py-3 text-[#475569] whitespace-nowrap">
                      ~{s.estimated_duration_minutes} mins
                    </td>

                    <td className="px-3 sm:px-4 py-3 text-[#64748B] max-w-[220px]">
                      <div className="truncate" title={s.description || ''}>
                        {s.description || '—'}
                      </div>
                    </td>

                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditService(s)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-[#A7F3D0] bg-white text-[#047857] hover:bg-[#ECFDF5] whitespace-nowrap"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleService(s.id, s.is_active)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer whitespace-nowrap ${
                            s.is_active
                              ? 'bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]'
                              : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                          }`}
                        >
                          {s.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: STAFF & PERMISSIONS (RBAC) */}
      {/* ============================================================== */}
      {activeTab === 'users' && (
        <div className="w-full min-w-0 p-3 sm:p-4 lg:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#E2E8F0]">
            <h4 className="font-bold text-base text-[#047857]">
              Role-Based Access Control & Station Assignments
            </h4>

            <p className="mt-1 text-xs leading-5 text-[#64748B]">
              Elevate registered accounts to Officers or Operators, and assign dedicated counter stations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setProfileView('users')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                profileView === 'users'
                  ? 'bg-[#10B981] text-white border-[#10B981]'
                  : 'bg-white text-[#047857] border-[#A7F3D0] hover:bg-[#ECFDF5]'
              }`}
            >
              Citizens / Users ({profiles.filter((p) => p.role === 'user').length})
            </button>

            <button
              type="button"
              onClick={() => setProfileView('staff')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                profileView === 'staff'
                  ? 'bg-[#10B981] text-white border-[#10B981]'
                  : 'bg-white text-[#047857] border-[#A7F3D0] hover:bg-[#ECFDF5]'
              }`}
            >
              Staff ({profiles.filter((p) => p.role !== 'user').length})
            </button>
          </div>

          <div className="text-sm font-bold text-[#047857]">
            {profileView === 'users' ? 'Registered Citizens' : 'Staff & Permissions'}
          </div>

          <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-[#F8FAFC]">
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px]">
                  <th className="px-3 sm:px-4 py-3 font-bold">Name</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">Email</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">System Role</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">Assigned Counter</th>
                  <th className="px-3 sm:px-4 py-3 font-bold">Registered</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0]/60">
                {profiles
                  .filter((p) =>
                    profileView === 'users'
                      ? p.role === 'user'
                      : p.role !== 'user'
                  )
                  .map((p) => {
                    const roleBadge = getRoleBadge(p.role);

                    return (
                      <tr key={p.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 sm:px-4 py-3 font-bold text-[#047857] min-w-[140px]">
                          {p.full_name}
                        </td>

                        <td className="px-3 sm:px-4 py-3 text-[#475569] min-w-[200px]">
                          {p.email}
                        </td>

                        <td className="px-3 sm:px-4 py-3">
                          <select
                            value={p.role}
                            onChange={(e) =>
                              handleRoleChange(p.id, e.target.value as UserRole)
                            }
                            className="w-full min-w-[170px] px-3 py-2 text-xs font-semibold rounded-lg border border-[#E2E8F0] bg-white cursor-pointer outline-none focus:border-[#10B981]"
                          >
                            <option value="user">Citizen (User)</option>
                            <option value="token_operator">Token Operator</option>
                            <option value="operation_officer">Operation Officer</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>

                        <td className="px-3 sm:px-4 py-3">
                          {p.role === 'operation_officer' ? (
                            <select
                              value={p.assigned_shelf_id || ''}
                              onChange={(e) =>
                                handleAssignShelf(p.id, e.target.value)
                              }
                              className="w-full min-w-[170px] px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white cursor-pointer outline-none focus:border-[#10B981]"
                            >
                              <option value="">(None assigned)</option>

                              {shelves.map((sh) => (
                                <option key={sh.id} value={sh.id}>
                                  {sh.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>

                        <td className="px-3 sm:px-4 py-3 text-[#64748B] whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
