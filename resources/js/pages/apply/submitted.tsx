import { Head } from '@inertiajs/react';
import { CircleCheck, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ApplySubmitted({
    reference,
    helpPhone,
}: {
    reference: string;
    helpPhone: string;
}) {
    return (
        <>
            <Head title="Ubusabe bwakiriwe" />
            <div className="flex min-h-screen items-center bg-muted/40 px-4 py-10">
                <div className="mx-auto grid w-full max-w-lg gap-6">
                    <img
                        src="/images/fondazione-marcegaglia.png"
                        alt="Fondazione Marcegaglia"
                        className="mx-auto h-14 w-auto"
                    />
                    <Card>
                        <CardContent className="grid justify-items-center gap-4 text-center">
                            <CircleCheck className="size-14 text-green-600 dark:text-green-400" />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Ubusabe bwawe bwakiriwe!
                            </h1>
                            <p className="text-muted-foreground">
                                Murakoze gusaba inkunga ya Fondo Robi. Ubusabe
                                bwawe buzasuzumwa n’itsinda rya Fondazione
                                Marcegaglia.
                            </p>
                            <div className="grid w-full gap-1 rounded-lg border bg-muted p-4">
                                <span className="text-sm text-muted-foreground">
                                    Nimero y’ubusabe bwawe
                                </span>
                                <span className="font-mono text-3xl font-bold tracking-wider">
                                    {reference}
                                </span>
                            </div>
                            <p className="text-sm">
                                Bika iyi nimero. Uzayikenera igihe ushaka
                                amakuru ku busabe bwawe.
                            </p>
                        </CardContent>
                    </Card>
                    <p className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                        <Phone className="size-4" />
                        Ku bindi bisobanuro, hamagara kuri:
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
