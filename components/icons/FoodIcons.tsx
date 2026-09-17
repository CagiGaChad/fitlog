interface IconProps {
  className?: string;
}

// Pechuga de pollo — representa la proteína.
export function ChickenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.5 3.5c2.8-1.4 6.3-.6 8 2 1.6 2.4 1.3 5.6-.6 7.7l-4.3 4.7c-1.6 1.8-4.3 2.1-6.3.7-2.1-1.5-2.7-4.3-1.4-6.5l.4-.7c.4-.7.3-1.6-.3-2.2l-.6-.6c-1-1-1-2.6 0-3.5.9-.9 2.4-1 3.4-.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.2c1 .3 2.1 1.1 2.8 2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Bol de arroz — representa los carbohidratos.
export function RiceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 11h16c0 4.4-3.6 8-8 8s-8-3.6-8-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3.5 11c0-.7.4-1.2 1-1.4 3.6-1.3 11.4-1.3 15 0 .6.2 1 .7 1 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 6.5 8 5m4 2-.6-2M15 6.5l1-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Medio aguacate — representa las grasas.
export function AvocadoIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3c3.6 0 6.5 4 6.5 9s-2.9 9-6.5 9-6.5-4-6.5-9S8.4 3 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

// Llama — representa las calorías.
export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5c.6 2.4-.4 3.7-1.6 5-1.4 1.5-3 3.2-3 6 0 3.6 2.9 6.5 6.5 5.9 3-.5 5-3 4.6-6.1-.2-1.7-1.1-2.7-1.9-3.5.2 1.4-.2 2.3-.9 3-.2-2.1-1.2-3.6-2.4-4.8-.9-.9-1.5-2.1-1.3-3.5-.8.5-1.5 1.2-1.9 2.2-.5 1.2-.3 2.3.1 3.2-1-.6-1.6-1.7-1.6-3.1 0-1.8 1.1-3.3 3.4-4.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
