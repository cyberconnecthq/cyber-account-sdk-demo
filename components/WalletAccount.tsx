import { useAccount } from "wagmi";

function Account() {
  const { address } = useAccount();

  return (
    <div>
      <p className="text-lg font-bold">EOA</p>
      <div>Address: {address || "-"}</div>
    </div>
  );
}

export default Account;
