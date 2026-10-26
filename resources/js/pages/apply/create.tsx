import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
    Phone,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/GrantApplicationController';
import BudgetTable, { budgetTotal } from '@/components/apply/budget-table';
import {
    ChoiceField,
    Field,
    SelectField,
    YesNoField,
} from '@/components/apply/fields';
import DatePicker from '@/components/date-picker';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatKinyarwandaDate, formatRwf } from '@/lib/utils';
import type { BudgetItem, ProvinceOption, SelectOption } from '@/types';

type ApplicationForm = {
    full_name: string;
    date_of_birth: string;
    national_id: string;
    phone: string;
    email: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    is_team: boolean | null;
    team_representative_name: string;
    team_members_count: string;
    team_women_count: string;
    is_woman_led: boolean | null;
    is_adult: boolean | null;
    has_operated_one_year: boolean | null;
    is_main_occupation: boolean | null;
    can_continue_without_grant: boolean | null;
    creates_jobs: boolean | null;
    education_level: string;
    education_level_other: string;
    has_related_training: boolean | null;
    related_training_details: string;
    previous_work: string;
    received_previous_support: boolean | null;
    previous_support_details: string;
    has_assets: boolean | null;
    assets_details: string;
    grant_need: string;
    expected_impact: string;
    business_name: string;
    industry: string;
    industry_other: string;
    business_years_operating: string;
    business_district: string;
    business_sector: string;
    business_summary: string;
    planned_jobs: string;
    planned_jobs_for_women: string;
    budget_items: BudgetItem[];
    will_submit_business_plan: boolean;
    signature_name: string;
    declaration: boolean;
};

const steps = [
    {
        title: 'Umwirondoro',
        heading: 'A. Amakuru y’umwirondoro w’usaba',
        fields: [
            'full_name',
            'date_of_birth',
            'national_id',
            'phone',
            'email',
            'province',
            'district',
            'sector',
            'cell',
            'village',
            'is_team',
            'team_representative_name',
            'team_members_count',
            'team_women_count',
        ],
    },
    {
        title: 'Ibyangombwa',
        heading: 'B. Kwemeza ko usaba yujuje ibyangombwa',
        fields: [
            'is_woman_led',
            'is_adult',
            'has_operated_one_year',
            'is_main_occupation',
            'can_continue_without_grant',
            'creates_jobs',
        ],
    },
    {
        title: 'Inkuru ngufi',
        heading: 'C. Inkuru ngufi y’ubuzima bw’usaba n’iy’umushinga',
        fields: [
            'education_level',
            'education_level_other',
            'has_related_training',
            'related_training_details',
            'previous_work',
            'received_previous_support',
            'previous_support_details',
            'has_assets',
            'assets_details',
            'grant_need',
            'expected_impact',
        ],
    },
    {
        title: 'Umushinga',
        heading: 'D. Incamake y’umushinga w’ubucuruzi',
        fields: [
            'business_name',
            'industry',
            'industry_other',
            'business_years_operating',
            'business_district',
            'business_sector',
            'business_summary',
            'planned_jobs',
            'planned_jobs_for_women',
            'budget_items',
            'budget_items.*.description',
            'budget_items.*.quantity',
            'budget_items.*.amount',
        ],
    },
    {
        title: 'Kwemeza',
        heading: 'E & F. Imigereka n’umukono',
        fields: ['will_submit_business_plan', 'signature_name', 'declaration'],
    },
] as const;

const lastStep = steps.length - 1;

const eligibilityQuestions = [
    {
        field: 'is_woman_led',
        label: 'Ndi Umunyarwandakazi (cyangwa turi itsinda rifite nibura 50% by’abagore)',
        mandatory: true,
    },
    {
        field: 'is_adult',
        label: 'Mfite nibura imyaka 18 y’amavuko',
        mandatory: true,
    },
    {
        field: 'has_operated_one_year',
        label: 'Ubucuruzi bwanjye bumaze nibura umwaka umwe (1) bukora',
        mandatory: true,
    },
    {
        field: 'is_main_occupation',
        label: 'Ubu bucuruzi/umushinga wanjye ni ko kazi kanjye nkora ka buri munsi konyine',
        mandatory: false,
    },
    {
        field: 'can_continue_without_grant',
        label: 'Ubucuruzi/umushinga wanjye wakomeza gukora n’ubwo ntahabwa iyi nkunga',
        mandatory: false,
    },
    {
        field: 'creates_jobs',
        label: 'Ubucuruzi/umushinga wanjye waha cyangwa wahaye abandi bantu akazi',
        mandatory: false,
    },
] as const;

function ageFrom(dateOfBirth: string): number | null {
    if (!dateOfBirth) {
        return null;
    }

    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hadBirthday =
        today.getMonth() > birth.getMonth() ||
        (today.getMonth() === birth.getMonth() &&
            today.getDate() >= birth.getDate());

    if (!hadBirthday) {
        age--;
    }

    return Number.isNaN(age) ? null : age;
}

/**
 * Bounds matching the server rule: after 1920-01-01 and before today.
 */
const earliestDateOfBirth = new Date(1920, 0, 2);

function latestDateOfBirth(): Date {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
}

function todayIso(): string {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-');
}

function stepOfError(errorKey: string): number {
    const root = errorKey.split('.')[0];

    return steps.findIndex((step) =>
        step.fields.some((field) => field.split('.')[0] === root),
    );
}

export default function ApplyCreate({
    isOpen,
    deadline,
    grantAmount,
    helpPhone,
    provinces,
    industries,
    educationLevels,
}: {
    isOpen: boolean;
    deadline: string;
    grantAmount: number;
    helpPhone: string;
    provinces: ProvinceOption[];
    industries: SelectOption[];
    educationLevels: SelectOption[];
}) {
    const [step, setStep] = useState(0);

    const form = useForm<ApplicationForm>('grant-application', {
        full_name: '',
        date_of_birth: '',
        national_id: '',
        phone: '',
        email: '',
        province: '',
        district: '',
        sector: '',
        cell: '',
        village: '',
        is_team: null,
        team_representative_name: '',
        team_members_count: '',
        team_women_count: '',
        is_woman_led: null,
        is_adult: null,
        has_operated_one_year: null,
        is_main_occupation: null,
        can_continue_without_grant: null,
        creates_jobs: null,
        education_level: '',
        education_level_other: '',
        has_related_training: null,
        related_training_details: '',
        previous_work: '',
        received_previous_support: null,
        previous_support_details: '',
        has_assets: null,
        assets_details: '',
        grant_need: '',
        expected_impact: '',
        business_name: '',
        industry: '',
        industry_other: '',
        business_years_operating: '',
        business_district: '',
        business_sector: '',
        business_summary: '',
        planned_jobs: '',
        planned_jobs_for_women: '',
        budget_items: [{ description: '', quantity: '', amount: '' }],
        will_submit_business_plan: false,
        signature_name: '',
        declaration: false,
    }).withPrecognition(store());

    const { data, setData } = form;
    const errors = form.errors as Record<string, string | undefined>;
    const hasErrors = Object.keys(errors).length > 0;
    const age = ageFrom(data.date_of_birth);
    const selectedProvince = provinces.find((p) => p.value === data.province);
    const allDistricts = provinces
        .flatMap((p) => p.districts)
        .sort()
        .map((d) => ({ value: d, label: d }));

    const goToStep = (index: number) => {
        setStep(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const next = () => {
        form.validate({
            only: [...steps[step].fields],
            onSuccess: () => goToStep(step + 1),
        });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (step < lastStep) {
            next();

            return;
        }

        form.submit({
            onError: (submitErrors) => {
                const firstStep = Math.min(
                    ...Object.keys(submitErrors)
                        .map(stepOfError)
                        .filter((index) => index >= 0),
                );

                if (Number.isFinite(firstStep) && firstStep !== step) {
                    goToStep(firstStep);
                }
            },
        });
    };

    const text = (field: keyof ApplicationForm) => ({
        id: field,
        value: data[field] as string,
        onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        ) => setData(field, e.target.value),
        'aria-invalid': !!errors[field],
    });

    const number = (field: keyof ApplicationForm) => ({
        ...text(field),
        inputMode: 'numeric' as const,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setData(field, e.target.value.replace(/\D/g, '')),
    });

    return (
        <>
            <Head title="Ifishi y'ubusabe" />
            <div className="min-h-screen bg-muted/40 px-4 py-6 sm:py-10">
                <div className="mx-auto grid max-w-3xl gap-6">
                    <header className="grid gap-3 text-center">
                        <img
                            src="/images/fondazione-marcegaglia.png"
                            alt="Fondazione Marcegaglia"
                            className="mx-auto h-14 w-auto"
                        />
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Fondazione Marcegaglia ETS – Rwanda
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Ifishi y’ubusabe
                        </h1>
                        <p className="text-base">
                            Fondo Robi – Inkunga ku mishinga y’ubucuruzi
                            y’abagore
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Igihe ntarengwa cyo gutanga ubusabe:{' '}
                            <strong className="text-foreground">
                                {formatKinyarwandaDate(deadline)}
                            </strong>
                        </p>
                    </header>

                    {!isOpen ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Igihe cyo gutanga ubusabe cyarangiye
                                </CardTitle>
                                <CardDescription>
                                    Ntibigishoboka gutanga ubusabe bushya.
                                    Murakoze ku bw’inyota mufitiye iyi nkunga.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <form
                            onSubmit={submit}
                            noValidate
                            className="grid gap-6"
                        >
                            <Stepper
                                current={step}
                                onSelect={(index) =>
                                    index < step && goToStep(index)
                                }
                            />

                            {errors.deadline && (
                                <Alert variant="destructive">
                                    <AlertTriangle />
                                    <AlertTitle>{errors.deadline}</AlertTitle>
                                </Alert>
                            )}

                            <Card>
                                <CardHeader>
                                    <p className="text-sm text-muted-foreground">
                                        Intambwe ya {step + 1} kuri{' '}
                                        {steps.length}
                                    </p>
                                    <CardTitle className="text-xl">
                                        {steps[step].heading}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    {step === 0 && (
                                        <>
                                            <Field
                                                id="full_name"
                                                label="Amazina"
                                                hint="Andika amazina yawe yose nk’uko ari ku ndangamuntu."
                                                error={errors.full_name}
                                            >
                                                <Input
                                                    {...text('full_name')}
                                                    autoComplete="name"
                                                />
                                            </Field>

                                            <div className="grid gap-6 sm:grid-cols-[1fr_8rem]">
                                                <Field
                                                    id="date_of_birth"
                                                    label="Itariki y’amavuko"
                                                    error={errors.date_of_birth}
                                                >
                                                    <DatePicker
                                                        id="date_of_birth"
                                                        value={
                                                            data.date_of_birth
                                                        }
                                                        onChange={(value) =>
                                                            setData(
                                                                'date_of_birth',
                                                                value,
                                                            )
                                                        }
                                                        min={
                                                            earliestDateOfBirth
                                                        }
                                                        max={latestDateOfBirth()}
                                                        invalid={
                                                            !!errors.date_of_birth
                                                        }
                                                    />
                                                </Field>
                                                <div className="grid content-start gap-2">
                                                    <span className="text-sm font-medium">
                                                        Imyaka
                                                    </span>
                                                    <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                                                        {age ?? '—'}
                                                    </div>
                                                </div>
                                            </div>

                                            <Field
                                                id="national_id"
                                                label="Nomero y’indangamuntu (ID)"
                                                hint="Imibare 16 iri ku ndangamuntu yawe."
                                                error={errors.national_id}
                                            >
                                                <Input
                                                    {...number('national_id')}
                                                    maxLength={16}
                                                />
                                            </Field>

                                            <div className="grid gap-6 sm:grid-cols-2">
                                                <Field
                                                    id="phone"
                                                    label="Telefoni"
                                                    hint="Urugero: 0788123456"
                                                    error={errors.phone}
                                                >
                                                    <Input
                                                        {...text('phone')}
                                                        type="tel"
                                                        inputMode="tel"
                                                        autoComplete="tel"
                                                    />
                                                </Field>
                                                <Field
                                                    id="email"
                                                    label="Imeri"
                                                    hint="Niba uyifite."
                                                    optional
                                                    error={errors.email}
                                                >
                                                    <Input
                                                        {...text('email')}
                                                        type="email"
                                                        autoComplete="email"
                                                    />
                                                </Field>
                                            </div>

                                            <fieldset className="grid gap-4">
                                                <legend className="mb-2 font-medium">
                                                    Aho utuye
                                                </legend>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <SelectField
                                                        id="province"
                                                        label="Intara"
                                                        options={provinces}
                                                        value={data.province}
                                                        onChange={(value) =>
                                                            form.setData(
                                                                (current) => ({
                                                                    ...current,
                                                                    province:
                                                                        value,
                                                                    district:
                                                                        '',
                                                                }),
                                                            )
                                                        }
                                                        error={errors.province}
                                                    />
                                                    <SelectField
                                                        id="district"
                                                        label="Akarere"
                                                        placeholder={
                                                            selectedProvince
                                                                ? 'Hitamo'
                                                                : 'Banza uhitemo intara'
                                                        }
                                                        disabled={
                                                            !selectedProvince
                                                        }
                                                        options={(
                                                            selectedProvince?.districts ??
                                                            []
                                                        ).map((d) => ({
                                                            value: d,
                                                            label: d,
                                                        }))}
                                                        value={data.district}
                                                        onChange={(value) =>
                                                            setData(
                                                                'district',
                                                                value,
                                                            )
                                                        }
                                                        error={errors.district}
                                                    />
                                                    <Field
                                                        id="sector"
                                                        label="Umurenge"
                                                        error={errors.sector}
                                                    >
                                                        <Input
                                                            {...text('sector')}
                                                        />
                                                    </Field>
                                                    <Field
                                                        id="cell"
                                                        label="Akagari"
                                                        error={errors.cell}
                                                    >
                                                        <Input
                                                            {...text('cell')}
                                                        />
                                                    </Field>
                                                    <Field
                                                        id="village"
                                                        label="Umudugudu"
                                                        error={errors.village}
                                                    >
                                                        <Input
                                                            {...text('village')}
                                                        />
                                                    </Field>
                                                </div>
                                            </fieldset>

                                            <YesNoField
                                                id="is_team"
                                                label="Ese musaba muri itsinda (team)?"
                                                value={data.is_team}
                                                onChange={(value) =>
                                                    setData('is_team', value)
                                                }
                                                error={errors.is_team}
                                            />

                                            {data.is_team && (
                                                <div className="grid gap-4 rounded-lg border bg-muted/50 p-4">
                                                    <Field
                                                        id="team_representative_name"
                                                        label="Amazina y’urihagarariye itsinda"
                                                        error={
                                                            errors.team_representative_name
                                                        }
                                                    >
                                                        <Input
                                                            {...text(
                                                                'team_representative_name',
                                                            )}
                                                        />
                                                    </Field>
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <Field
                                                            id="team_members_count"
                                                            label="Umubare w’abagize itsinda bose"
                                                            error={
                                                                errors.team_members_count
                                                            }
                                                        >
                                                            <Input
                                                                {...number(
                                                                    'team_members_count',
                                                                )}
                                                            />
                                                        </Field>
                                                        <Field
                                                            id="team_women_count"
                                                            label="Umubare w’abagore bari mu itsinda"
                                                            error={
                                                                errors.team_women_count
                                                            }
                                                        >
                                                            <Input
                                                                {...number(
                                                                    'team_women_count',
                                                                )}
                                                            />
                                                        </Field>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {step === 1 && (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                Subiza “Yego” cyangwa “Oya” kuri
                                                buri kibazo. Ibibazo bitatu bya
                                                mbere ni ibyangombwa by’ibanze
                                                kugira ngo ubusabe bwawe
                                                bwemerwe.
                                            </p>
                                            {eligibilityQuestions.map(
                                                ({
                                                    field,
                                                    label,
                                                    mandatory,
                                                }) => (
                                                    <div
                                                        key={field}
                                                        className="grid gap-2"
                                                    >
                                                        <YesNoField
                                                            id={field}
                                                            label={label}
                                                            value={data[field]}
                                                            onChange={(value) =>
                                                                setData(
                                                                    field,
                                                                    value,
                                                                )
                                                            }
                                                            error={
                                                                errors[field]
                                                            }
                                                        />
                                                        {mandatory &&
                                                            data[field] ===
                                                                false && (
                                                                <p className="flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                                                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                                                    Iki ni kimwe
                                                                    mu
                                                                    byangombwa
                                                                    by’ibanze.
                                                                    Ubusabe
                                                                    bwawe
                                                                    bushobora
                                                                    kutemerwa.
                                                                </p>
                                                            )}
                                                    </div>
                                                ),
                                            )}
                                        </>
                                    )}

                                    {step === 2 && (
                                        <>
                                            <ChoiceField
                                                id="education_level"
                                                label="1. Ni uruhe rwego rwo hejuru rw’amashuri warangije?"
                                                options={educationLevels}
                                                value={data.education_level}
                                                onChange={(value) =>
                                                    setData(
                                                        'education_level',
                                                        value,
                                                    )
                                                }
                                                error={errors.education_level}
                                            />
                                            {data.education_level ===
                                                'other' && (
                                                <Field
                                                    id="education_level_other"
                                                    label="Sobanura urwego rw’amashuri"
                                                    error={
                                                        errors.education_level_other
                                                    }
                                                >
                                                    <Input
                                                        {...text(
                                                            'education_level_other',
                                                        )}
                                                    />
                                                </Field>
                                            )}

                                            <YesNoField
                                                id="has_related_training"
                                                label="2. Warangije amasomo, amahugurwa, cyangwa ufite impamyabumenyi ifitanye isano n’umushinga wawe w’ubucuruzi?"
                                                value={
                                                    data.has_related_training
                                                }
                                                onChange={(value) =>
                                                    setData(
                                                        'has_related_training',
                                                        value,
                                                    )
                                                }
                                                error={
                                                    errors.has_related_training
                                                }
                                            />
                                            {data.has_related_training && (
                                                <Field
                                                    id="related_training_details"
                                                    label="Ni ayahe?"
                                                    error={
                                                        errors.related_training_details
                                                    }
                                                >
                                                    <Textarea
                                                        {...text(
                                                            'related_training_details',
                                                        )}
                                                    />
                                                </Field>
                                            )}

                                            <Field
                                                id="previous_work"
                                                label="3. Ni ubuhe bwoko bw’akazi wabanje gukora mbere cyangwa ugifatanya n’umushinga wawe?"
                                                error={errors.previous_work}
                                            >
                                                <Textarea
                                                    {...text('previous_work')}
                                                />
                                            </Field>

                                            <YesNoField
                                                id="received_previous_support"
                                                label="4. Waba warigeze uhabwa inkunga cyangwa ubufasha ku mushinga w’ubucuruzi?"
                                                value={
                                                    data.received_previous_support
                                                }
                                                onChange={(value) =>
                                                    setData(
                                                        'received_previous_support',
                                                        value,
                                                    )
                                                }
                                                error={
                                                    errors.received_previous_support
                                                }
                                            />
                                            {data.received_previous_support && (
                                                <Field
                                                    id="previous_support_details"
                                                    label="Sobanura inkunga cyangwa ubufasha wahawe"
                                                    error={
                                                        errors.previous_support_details
                                                    }
                                                >
                                                    <Textarea
                                                        {...text(
                                                            'previous_support_details',
                                                        )}
                                                    />
                                                </Field>
                                            )}

                                            <YesNoField
                                                id="has_assets"
                                                label="5. Ufite ubutaka, ibikoresho, cyangwa indi mitungo yagufasha mu mushinga wawe w’ubucuruzi?"
                                                value={data.has_assets}
                                                onChange={(value) =>
                                                    setData('has_assets', value)
                                                }
                                                error={errors.has_assets}
                                            />
                                            {data.has_assets && (
                                                <Field
                                                    id="assets_details"
                                                    label="Ni iyihe mitungo ufite?"
                                                    error={
                                                        errors.assets_details
                                                    }
                                                >
                                                    <Textarea
                                                        {...text(
                                                            'assets_details',
                                                        )}
                                                    />
                                                </Field>
                                            )}

                                            <Field
                                                id="grant_need"
                                                label="6. Kubera iki ukeneye iyi nkunga?"
                                                hint="Sobanura neza ikibazo ushaka gukemura cyangwa amahirwe ushaka gukoresha."
                                                error={errors.grant_need}
                                            >
                                                <Textarea
                                                    {...text('grant_need')}
                                                    rows={5}
                                                />
                                            </Field>

                                            <Field
                                                id="expected_impact"
                                                label="7. Ni izihe mpinduka wifuza ko uyu mushinga uzagira ku buzima bwawe bwite no ku iterambere ry’umuryango wawe?"
                                                error={errors.expected_impact}
                                            >
                                                <Textarea
                                                    {...text('expected_impact')}
                                                    rows={5}
                                                />
                                            </Field>
                                        </>
                                    )}

                                    {step === 3 && (
                                        <>
                                            <Field
                                                id="business_name"
                                                label="Izina ry’umushinga"
                                                error={errors.business_name}
                                            >
                                                <Input
                                                    {...text('business_name')}
                                                />
                                            </Field>

                                            <SelectField
                                                id="industry"
                                                label="Urwego rw’ubucuruzi"
                                                options={industries}
                                                value={data.industry}
                                                onChange={(value) =>
                                                    setData('industry', value)
                                                }
                                                error={errors.industry}
                                            />
                                            {data.industry === 'other' && (
                                                <Field
                                                    id="industry_other"
                                                    label="Sobanura urwego rw’ubucuruzi"
                                                    error={
                                                        errors.industry_other
                                                    }
                                                >
                                                    <Input
                                                        {...text(
                                                            'industry_other',
                                                        )}
                                                    />
                                                </Field>
                                            )}

                                            <Field
                                                id="business_years_operating"
                                                label="Igihe umushinga umaze ukora (imyaka)"
                                                error={
                                                    errors.business_years_operating
                                                }
                                            >
                                                <Input
                                                    {...number(
                                                        'business_years_operating',
                                                    )}
                                                    className="sm:max-w-40"
                                                />
                                            </Field>

                                            <fieldset className="grid gap-4">
                                                <legend className="mb-2 font-medium">
                                                    Aho ukorera
                                                </legend>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <SelectField
                                                        id="business_district"
                                                        label="Akarere"
                                                        options={allDistricts}
                                                        value={
                                                            data.business_district
                                                        }
                                                        onChange={(value) =>
                                                            setData(
                                                                'business_district',
                                                                value,
                                                            )
                                                        }
                                                        error={
                                                            errors.business_district
                                                        }
                                                    />
                                                    <Field
                                                        id="business_sector"
                                                        label="Umurenge"
                                                        error={
                                                            errors.business_sector
                                                        }
                                                    >
                                                        <Input
                                                            {...text(
                                                                'business_sector',
                                                            )}
                                                        />
                                                    </Field>
                                                </div>
                                            </fieldset>

                                            <Field
                                                id="business_summary"
                                                label="Incamake y’umushinga n’intego zawo nyamukuru"
                                                error={errors.business_summary}
                                            >
                                                <Textarea
                                                    {...text(
                                                        'business_summary',
                                                    )}
                                                    rows={5}
                                                />
                                            </Field>

                                            <div className="grid gap-6 sm:grid-cols-2">
                                                <Field
                                                    id="planned_jobs"
                                                    label="Umubare w’imirimo mishya uteganya kurema"
                                                    error={errors.planned_jobs}
                                                >
                                                    <Input
                                                        {...number(
                                                            'planned_jobs',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    id="planned_jobs_for_women"
                                                    label="Muri iyo mirimo, ingahe zizahabwa abagore?"
                                                    error={
                                                        errors.planned_jobs_for_women
                                                    }
                                                >
                                                    <Input
                                                        {...number(
                                                            'planned_jobs_for_women',
                                                        )}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-2">
                                                <h3 className="font-medium">
                                                    Uko inkunga izakoreshwa (
                                                    {formatRwf(grantAmount)})
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Andika buri gikorwa cyangwa
                                                    ikintu uzagura, ingano yacyo
                                                    n’amafaranga kizatwara.
                                                    Igiteranyo ntigishobora
                                                    kurenga{' '}
                                                    {formatRwf(grantAmount)}.
                                                </p>
                                                <BudgetTable
                                                    items={data.budget_items}
                                                    grantAmount={grantAmount}
                                                    errors={errors}
                                                    onChange={(items) =>
                                                        setData(
                                                            'budget_items',
                                                            items,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    {step === lastStep && (
                                        <>
                                            <section className="grid gap-3">
                                                <h3 className="font-medium">
                                                    E. Imigereka
                                                </h3>
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        id="will_submit_business_plan"
                                                        checked={
                                                            data.will_submit_business_plan
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            setData(
                                                                'will_submit_business_plan',
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                        className="mt-0.5"
                                                    />
                                                    <Label
                                                        htmlFor="will_submit_business_plan"
                                                        className="leading-snug font-normal"
                                                    >
                                                        Nzatanga inyigo
                                                        y’umushinga (business
                                                        plan) itarenze impapuro
                                                        eshatu (3) ku mugereka
                                                        w’iyi fishi.
                                                    </Label>
                                                </div>
                                            </section>

                                            <section className="grid gap-4">
                                                <h3 className="font-medium">
                                                    F. Umukono
                                                </h3>
                                                <Field
                                                    id="signature_name"
                                                    label="Umukono w’usaba"
                                                    hint="Andika amazina yawe yose nk’umukono wawe."
                                                    error={
                                                        errors.signature_name
                                                    }
                                                >
                                                    <Input
                                                        {...text(
                                                            'signature_name',
                                                        )}
                                                    />
                                                </Field>
                                                <p className="text-sm">
                                                    Itariki:{' '}
                                                    <strong>
                                                        {formatKinyarwandaDate(
                                                            todayIso(),
                                                        )}
                                                    </strong>
                                                </p>
                                                <div className="grid gap-1">
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            id="declaration"
                                                            checked={
                                                                data.declaration
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                setData(
                                                                    'declaration',
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                            aria-invalid={
                                                                !!errors.declaration
                                                            }
                                                            className="mt-0.5"
                                                        />
                                                        <Label
                                                            htmlFor="declaration"
                                                            className="leading-snug font-normal"
                                                        >
                                                            Ndemeza ko amakuru
                                                            yose natanze muri
                                                            iyi fishi ari ukuri.
                                                        </Label>
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors.declaration
                                                        }
                                                    />
                                                </div>
                                            </section>

                                            <Review
                                                data={data}
                                                onEdit={goToStep}
                                            />
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {hasErrors && !errors.deadline && (
                                <Alert variant="destructive">
                                    <AlertTriangle />
                                    <AlertTitle>
                                        Hari ibitujujwe neza.
                                    </AlertTitle>
                                    <AlertDescription>
                                        Reba ibice byanditseho ibara ritukura,
                                        ubikosore.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex items-center justify-between gap-3">
                                {step > 0 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        onClick={() => goToStep(step - 1)}
                                    >
                                        <ChevronLeft />
                                        Subira inyuma
                                    </Button>
                                ) : (
                                    <span />
                                )}
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={
                                        form.validating || form.processing
                                    }
                                >
                                    {(form.validating || form.processing) && (
                                        <LoaderCircle className="animate-spin" />
                                    )}
                                    {step < lastStep
                                        ? 'Komeza'
                                        : 'Ohereza ubusabe'}
                                    {step < lastStep && <ChevronRight />}
                                </Button>
                            </div>
                        </form>
                    )}

                    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-muted-foreground">
                        <Phone className="size-4" />
                        Ku bindi bisobanuro cyangwa ubufasha mu kuzuza iyi
                        fishi, hamagara kuri:{' '}
                        <a
                            href={`tel:${helpPhone}`}
                            className="font-semibold text-foreground underline"
                        >
                            {helpPhone}
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}

function Stepper({
    current,
    onSelect,
}: {
    current: number;
    onSelect: (index: number) => void;
}) {
    return (
        <nav aria-label="Intambwe z'ifishi">
            <ol className="grid grid-cols-5 gap-2">
                {steps.map((step, index) => (
                    <li key={step.title}>
                        <button
                            type="button"
                            onClick={() => onSelect(index)}
                            disabled={index >= current}
                            aria-current={
                                index === current ? 'step' : undefined
                            }
                            className="group grid w-full justify-items-center gap-1.5 disabled:cursor-default"
                        >
                            <span
                                className={cn(
                                    'flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                                    index < current &&
                                        'border-primary bg-primary text-primary-foreground group-hover:opacity-80',
                                    index === current &&
                                        'border-primary text-primary',
                                    index > current &&
                                        'border-muted-foreground/30 text-muted-foreground',
                                )}
                            >
                                {index < current ? (
                                    <Check className="size-4" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span
                                className={cn(
                                    'text-center text-xs leading-tight',
                                    index === current
                                        ? 'font-medium'
                                        : 'hidden text-muted-foreground sm:block',
                                )}
                            >
                                {step.title}
                            </span>
                        </button>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

function Review({
    data,
    onEdit,
}: {
    data: ApplicationForm;
    onEdit: (step: number) => void;
}) {
    const rows: { label: string; value: string; step: number }[] = [
        { label: 'Amazina', value: data.full_name, step: 0 },
        { label: 'Indangamuntu', value: data.national_id, step: 0 },
        { label: 'Telefoni', value: data.phone, step: 0 },
        {
            label: 'Aho utuye',
            value: [data.district, data.sector, data.cell, data.village]
                .filter(Boolean)
                .join(', '),
            step: 0,
        },
        { label: 'Izina ry’umushinga', value: data.business_name, step: 3 },
        {
            label: 'Imirimo mishya',
            value: `${data.planned_jobs || 0} (abagore: ${data.planned_jobs_for_women || 0})`,
            step: 3,
        },
        {
            label: 'Igiteranyo cy’ingengo y’imari',
            value: formatRwf(budgetTotal(data.budget_items)),
            step: 3,
        },
    ];

    return (
        <section className="grid gap-3 rounded-lg border bg-muted/50 p-4">
            <h3 className="font-medium">
                Suzuma amakuru yawe mbere yo kohereza
            </h3>
            <dl className="grid gap-2 text-sm">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="grid grid-cols-[9rem_1fr_auto] items-baseline gap-2"
                    >
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="font-medium break-words">
                            {row.value || '—'}
                        </dd>
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => onEdit(row.step)}
                            className="h-auto p-0 text-xs"
                        >
                            Hindura
                        </Button>
                    </div>
                ))}
            </dl>
        </section>
    );
}
