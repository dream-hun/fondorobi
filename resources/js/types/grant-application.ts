export type SelectOption = {
    value: string;
    label: string;
};

export type ProvinceOption = SelectOption & {
    districts: string[];
};

export type BudgetItem = {
    description: string;
    quantity: string;
    amount: string;
};

export type Qualification = 'high' | 'medium' | 'low' | 'not_eligible';

export type ApplicationStatus =
    | 'pending'
    | 'shortlisted'
    | 'rejected'
    | 'approved';

export type ApplicationSummary = {
    id: number;
    reference: string;
    full_name: string;
    business_name: string;
    industry: string;
    district: string;
    is_team: boolean;
    score: number;
    qualification: Qualification;
    qualification_label: string;
    status: ApplicationStatus;
    status_label: string;
    submitted_at: string | null;
};

export type CountByCategory = SelectOption & {
    total: number;
};
