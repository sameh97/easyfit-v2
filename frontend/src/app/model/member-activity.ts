/** GET /api/members/:id/activity (redesign.md §7.10, Phase 2 step 5). */
export interface MemberActivity {
  memberId: number;
  classes: {
    /** Soonest first. */
    upcoming: MemberClass[];
    /** Newest first, at most 10. */
    past: MemberClass[];
  };
  purchases: {
    matchedBy: 'phone';
    /** Newest first, at most 50. */
    items: MemberPurchase[];
    totalCount: number;
    totalSpent: number;
  };
}

export interface MemberClass {
  id: number;
  startTime: string;
  description: string;
  trainer: { id: number; firstName: string; lastName: string } | null;
  participantCount: number;
}

export interface MemberPurchase {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  totalCost: number;
  createdAt: string;
}
