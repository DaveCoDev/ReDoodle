import "../App.css";

type HeaderProps = {
  puzzleName: string;
};

export default function Header({ puzzleName }: HeaderProps) {
  return (
    <header className="fixed left-1/2 -translate-x-1/2 w-full max-w-xl border-b pt-2 pb-2 px-4 flex flex-row justify-between items-end bg-pastelBlue z-10">
      <h1 className="text-4xl font-bold text-pastelGray">ReDoodle</h1>
      <p className="text-pastelGray text-2xl">{puzzleName}</p>
    </header>
  );
}
