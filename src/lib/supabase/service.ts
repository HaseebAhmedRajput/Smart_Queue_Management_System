import { supabase } from './client';
import type {
  Service,
  Floor,
  Shelf,
  Profile,
  Applicant,
  Token,
  TokenWithDetails,
  TokenEvent,
  UserRole,
  TokenStatus,
} from '../../types/database';

export const supabaseService = {
  // ==========================================
  // SERVICES
  // ==========================================
  async getServices(): Promise<Service[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }
    return (data as Service[]) || [];
  },

  async getAllServices(): Promise<Service[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
 if (error) {
  console.error('Database query failed:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  return [];
}
    return (data as Service[]) || [];
  },

  async createService(service: {
    name: string;
    code: string;
    description: string;
    estimated_duration_minutes: number;
    is_active?: boolean;
  }): Promise<{ data?: Service; error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { data, error } = await supabase
      .from('services')
      .insert({
        name: service.name.trim(),
        code: service.code.trim().toUpperCase(),
        description: service.description.trim(),
        estimated_duration_minutes: service.estimated_duration_minutes,
        is_active: service.is_active ?? true,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data: data as Service };
  },

  async updateService(
    id: string,
    updates: Partial<Service>
  ): Promise<{ error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    return {};
  },

  // ==========================================
  // FLOORS
  // ==========================================
  async getFloors(): Promise<Floor[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .order('floor_number');
  if (error) {
  console.error('Database query failed:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  return [];
}
    return (data as Floor[]) || [];
  },

  async createFloor(floor: {
    name: string;
    floor_number: number;
    description: string;
    is_active?: boolean;
  }): Promise<{ data?: Floor; error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { data, error } = await supabase
      .from('floors')
      .insert({
        name: floor.name.trim(),
        floor_number: floor.floor_number,
        description: floor.description.trim(),
        is_active: floor.is_active ?? true,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data: data as Floor };
  },

  async updateFloor(
    id: string,
    updates: Partial<Floor>
  ): Promise<{ error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { error } = await supabase
      .from('floors')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    return {};
  },

  // ==========================================
  // SHELVES / COUNTERS
  // ==========================================
  async getShelves(): Promise<Shelf[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('shelves')
      .select('*')
      .order('shelf_number');
 if (error) {
  console.error('Database query failed:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  return [];
}
    return (data as Shelf[]) || [];
  },

  async createShelf(shelf: {
    name: string;
    shelf_number: number;
    floor_id: string;
    service_ids: string[];
    is_active?: boolean;
    is_paused?: boolean;
  }): Promise<{ data?: Shelf; error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { data, error } = await supabase
      .from('shelves')
      .insert({
        name: shelf.name.trim(),
        shelf_number: shelf.shelf_number,
        floor_id: shelf.floor_id,
        service_ids: shelf.service_ids,
        is_active: shelf.is_active ?? true,
        is_paused: shelf.is_paused ?? false,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data: data as Shelf };
  },

  async updateShelf(
    id: string,
    updates: Partial<Shelf>
  ): Promise<{ error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { error } = await supabase
      .from('shelves')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    return {};
  },

  // ==========================================
  // PROFILES (STAFF & CITIZENS)
  // ==========================================
  async getProfiles(): Promise<Profile[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    return (data as Profile[]) || [];
  },

  async updateProfileRole(
    id: string,
    role: UserRole
  ): Promise<{ error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { error: error.message };
    return {};
  },

async assignShelfToOfficer(
  profileId: string,
  shelfId: string | null
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Database unconfigured' };

  const { error } = await supabase.rpc('assign_shelf_to_officer', {
    p_profile_id: profileId,
    p_shelf_id: shelfId,
  });

  if (error) {
    console.error('Officer assignment failed:', error);
    return { error: error.message };
  }

  return {};
},

  // ==========================================
  // APPLICANTS (FAMILY / CITIZEN PROFILES)
  // ==========================================
  async getApplicants(accountId: string): Promise<Applicant[]> {
    if (!supabase || !accountId) return [];
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching applicants:', error);
      return [];
    }
    return (data as Applicant[]) || [];
  },

  async createApplicant(applicant: {
    account_id: string;
    full_name: string;
    national_id_or_passport: string;
    date_of_birth?: string | null;
    phone?: string | null;
    relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  }): Promise<{ data?: Applicant; error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { data, error } = await supabase
      .from('applicants')
      .insert({
        account_id: applicant.account_id,
        full_name: applicant.full_name.trim(),
        national_id_or_passport: applicant.national_id_or_passport.trim(),
        date_of_birth: applicant.date_of_birth || null,
        phone: applicant.phone?.trim() || null,
        relationship: applicant.relationship,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data: data as Applicant };
  },

  async deleteApplicant(id: string): Promise<{ error?: string }> {
    if (!supabase) return { error: 'Database unconfigured' };
    const { error } = await supabase.from('applicants').delete().eq('id', id);
    if (error) return { error: error.message };
    return {};
  },

  // ==========================================
  // TOKENS & QUEUE OPERATIONS
  // ==========================================
  async getTokensForAccount(accountId: string): Promise<TokenWithDetails[]> {
    if (!supabase || !accountId) return [];
    const { data, error } = await supabase
      .from('tokens')
      .select(`
        *,
        applicant:applicants(*),
        service:services(*),
        shelf:shelves(*),
        floor:floors(*),
        officer:profiles!tokens_officer_id_fkey(*)
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }
    return (data as TokenWithDetails[]) || [];
  },

  async getAllTokensDetailed(): Promise<TokenWithDetails[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('tokens')
      .select(`
        *,
        applicant:applicants(*),
        service:services(*),
        shelf:shelves(*),
        floor:floors(*),
        officer:profiles!tokens_officer_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

if (error) {
  console.error('Database query failed:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  return [];
}
    return (data as TokenWithDetails[]) || [];
  },


async getPublicLiveQueue() {
  if (!supabase) {
    throw new Error('Database unconfigured');
  }

  const { data, error } = await supabase.rpc('get_public_live_queue');

  if (error) {
    console.error('[Public Queue RPC Error]', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw error;
  }

  return data || [];
},


  async getTokensForShelf(
  shelfId: string,
  serviceIds: string[] = []
): Promise<TokenWithDetails[]> {
  if (!supabase || !shelfId) return [];

  let query = supabase
    .from('tokens')
    .select(`
      *,
      applicant:applicants(*),
      service:services(*),
      shelf:shelves(*),
      floor:floors(*),
      officer:profiles!tokens_officer_id_fkey(*)
    `)
    .order('created_at', { ascending: true });

  if (serviceIds.length > 0) {
    query = query.or(
      `shelf_id.eq.${shelfId},and(status.eq.pending,service_id.in.(${serviceIds.join(',')}))`
    );
  } else {
    query = query.or(`shelf_id.eq.${shelfId},status.eq.pending`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching counter tokens:', error);
    throw error;
  }

  return (data as TokenWithDetails[]) || [];
},


async dispatchNextToken(
  shelfId: string,
  _officerId?: string
): Promise<{ success: boolean; message?: string; token?: Token }> {
  if (!supabase) {
    return { success: false, message: 'Database unconfigured' };
  }

  const { data, error } = await supabase.rpc(
    'dispatch_next_token_atomic',
    { p_shelf_id: shelfId }
  );

  if (error) {
    console.error('Atomic dispatch failed:', error);
    return { success: false, message: error.message };
  }

  if (!data) {
    return { success: false, message: 'No response received from server.' };
  }

  if (data.success && data.dispatched) {
    return {
      success: true,
      message: `Dispatched token ${data.display_number}`,
    };
  }

  return {
    success: false,
    message: data.message || data.error || 'No eligible pending token for this counter.',
  };
},


async generateToken(params: {
  accountId: string;
  applicantId: string;
  serviceId: string;
  isWalkIn?: boolean;
}): Promise<{ data?: Token; error?: string }> {
  if (!supabase) return { error: 'Database unconfigured' };

  const { data, error } = await supabase
    .from('tokens')
    .insert({
      applicant_id: params.applicantId,
      account_id: params.accountId,
      service_id: params.serviceId,
      status: 'pending',
      is_walk_in: params.isWalkIn ?? false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return {
        error: 'This applicant already has an active token for this service.',
      };
    }

    return { error: error.message };
  }

  return { data: data as Token };
},


  

  async startWork(
  tokenId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database unconfigured' };
  }

  const { data, error } = await supabase.rpc('start_token_work', {
    p_token_id: tokenId,
  });

  if (error) {
    console.error('Start token work failed:', error);
    return { success: false, error: error.message };
  }

  if (!data?.success) {
    return {
      success: false,
      error: 'Unable to start this token.',
    };
  }

  return { success: true };
},




  async markSuccessful(tokenId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Database unconfigured' };
    const { error } = await supabase
      .from('tokens')
      .update({
        status: 'successful',
        completed_at: new Date().toISOString(),
      })
      .eq('id', tokenId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

async markRejected(
  tokenId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  if (!reason?.trim()) {
    return { success: false, error: 'A rejection reason is required.' };
  }

  const { data, error } = await supabase.rpc(
    'handle_officer_token_action',
    {
      p_token_id: tokenId,
      p_action: 'rejected',
      p_reason: reason.trim(),
    }
  );

  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: 'Unable to reject token.' };

  return { success: true };
},

async markSkipped(
  tokenId: string,
  _calledAt: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Database unconfigured' };

  const { data, error } = await supabase.rpc(
    'handle_officer_token_action',
    {
      p_token_id: tokenId,
      p_action: 'skipped',
      p_reason: null,
    }
  );

  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: 'Unable to skip token.' };

  return { success: true };
},

  async cancelToken(tokenId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Database unconfigured' };
    const { error } = await supabase
      .from('tokens')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', tokenId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async getAnalytics() {
    if (!supabase) {
      return {
        totalTokens: 0,
        activeQueue: 0,
        completedToday: 0,
        rejectedCount: 0,
        noShowCount: 0,
        avgWaitSeconds: 0,
        avgServiceSeconds: 0,
        statusBreakdown: [] as { name: string; count: number; color: string }[],
        serviceVolume: [] as { name: string; code: string; count: number }[],
      };
    }

    const { data: tokens } = await supabase
      .from('tokens')
      .select('*, service:services(name, code)');

    const allTokens = (tokens as any[]) || [];

    const totalTokens = allTokens.length;
    const activeQueue = allTokens.filter((t) => ['pending', 'called', 'working'].includes(t.status)).length;
    const completedToday = allTokens.filter((t) => t.status === 'successful').length;
    const rejectedCount = allTokens.filter((t) => t.status === 'rejected').length;
    const noShowCount = allTokens.filter((t) => t.status === 'skipped').length;

    // Calculate avg wait time
    const waitTimes = allTokens
      .filter((t) => t.started_at && t.created_at)
      .map((t) => (new Date(t.started_at).getTime() - new Date(t.created_at).getTime()) / 1000);
    const avgWaitSeconds = waitTimes.length
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    // Calculate avg service time
    const serviceTimes = allTokens
      .filter((t) => t.completed_at && t.started_at && t.status === 'successful')
      .map((t) => (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 1000);
    const avgServiceSeconds = serviceTimes.length
      ? Math.round(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length)
      : 0;

    const statusCounts: Record<string, number> = {
      pending: 0,
      called: 0,
      working: 0,
      successful: 0,
      rejected: 0,
      skipped: 0,
      cancelled: 0,
    };
    allTokens.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    });

    const statusBreakdown = [
      { name: 'Pending', count: statusCounts.pending, color: '#D97706' },
      { name: 'Called', count: statusCounts.called, color: '#2563EB' },
      { name: 'Working', count: statusCounts.working, color: '#0284C7' },
      { name: 'Successful', count: statusCounts.successful, color: '#16A34A' },
      { name: 'Rejected', count: statusCounts.rejected, color: '#DC2626' },
      { name: 'Skipped', count: statusCounts.skipped, color: '#4B5563' },
    ];

    // Service volume
    const serviceMap = new Map<string, { name: string; code: string; count: number }>();
    allTokens.forEach((t) => {
      const code = t.service?.code || 'GEN';
      const name = t.service?.name || 'General';
      const prev = serviceMap.get(code) || { name, code, count: 0 };
      prev.count++;
      serviceMap.set(code, prev);
    });

    const serviceVolume = Array.from(serviceMap.values());

    return {
      totalTokens,
      activeQueue,
      completedToday,
      rejectedCount,
      noShowCount,
      avgWaitSeconds,
      avgServiceSeconds,
      statusBreakdown,
      serviceVolume,
    };
  },

  // ==========================================
  // REALTIME SUBSCRIPTION
subscribe(callback: () => void) {
  if (!supabase) return () => {};

  const channelName = `queue-realtime-${Math.random()
    .toString(36)
    .slice(2)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tokens' },
      () => callback()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shelves' },
      () => callback()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'services' },
      () => callback()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'floors' },
      () => callback()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => callback()
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        // console.info('[Queue Realtime] Connected');
        callback();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('[Queue Realtime] Connection failed:', status, error);
      }
    });

  return () => {
    void supabase?.removeChannel(channel);
  };
},



};




async function autoDispatchPendingTokens(serviceId?: string): Promise<void> {
  if (!supabase) return;

  // Find active, unpaused counters
  const { data: shelves, error } = await supabase
    .from('shelves')
    .select('id, service_ids, current_officer_id')
    .eq('is_active', true)
    .eq('is_paused', false);

  if (error) {
    console.error('Could not load available counters:', error.message);
    return;
  }

  if (!shelves?.length) return;

  // Dispatch one token at a time per eligible counter.
  // dispatchNextToken checks whether the counter is actually free.
  for (const shelf of shelves) {
    const supportedServices = shelf.service_ids || [];

    // A counter with no service restrictions can handle any service.
    if (
      serviceId &&
      supportedServices.length > 0 &&
      !supportedServices.includes(serviceId)
    ) {
      continue;
    }

    const result = await supabaseService.dispatchNextToken(
      shelf.id,
      shelf.current_officer_id || undefined
    );

    if (result.success) {
      console.log(`Automatic dispatch successful for counter ${shelf.id}`);
    }
  }
}