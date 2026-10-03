/** GET /api/members/:id/activity — read-only (redesign.md §7.6, §7.10 Phase 2 step 5). */
export interface MemberActivityDto {
  memberId: number;
  classes: {
    /** startTime from now on, soonest first (all of them). */
    upcoming: MemberClassDto[];
    /** startTime before now, newest first, at most 10. */
    past: MemberClassDto[];
  };
  purchases: {
    /** Bills don't reference members; they are matched on the phone number. */
    matchedBy: "phone";
    /** Newest first, at most 50. */
    items: MemberPurchaseDto[];
    /** All matched bills, not only the ones in `items`. */
    totalCount: number;
    /** ₪, over all matched bills. */
    totalSpent: number;
  };
}

export interface MemberClassDto {
  id: number;
  startTime: string;
  description: string;
  trainer: { id: number; firstName: string; lastName: string } | null;
  participantCount: number;
}

export interface MemberPurchaseDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  totalCost: number;
  createdAt: string;
}
