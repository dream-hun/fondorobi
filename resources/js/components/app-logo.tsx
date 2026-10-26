import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex items-center rounded-md bg-white px-2 py-1 group-data-[collapsible=icon]:hidden">
                <img
                    src="/images/fondazione-marcegaglia-ets.webp"
                    alt="Fondazione Marcegaglia ETS"
                    className="h-10 w-auto"
                />
            </div>
            <div className="hidden aspect-square size-8 items-center justify-center rounded-md bg-white group-data-[collapsible=icon]:flex">
                <AppLogoIcon className="size-6" />
            </div>
        </>
    );
}
