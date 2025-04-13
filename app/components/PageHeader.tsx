// components/PageHeader.tsx
type Props = {
    title: string;
    icon?: string; // emoji or icon component
  };
  
  export default function PageHeader({ title, icon }: Props) {
    return (
      <div className="mb-6 flex items-center gap-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-3xl font-extrabold tracking-tight text-white">{title}</h2>
        <hr className="mt-2 border-blue-600 w-full ml-2" />
      </div>
    );
  }
  