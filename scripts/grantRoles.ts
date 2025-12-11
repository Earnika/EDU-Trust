import hre from "hardhat";
const ethers = hre.ethers;

async function main() {
    console.log("Granting roles to address...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    // Contract address from deployment
    const CERTIFICATE_NFT_ADDRESS = "0x9a8b0E691Ef904b7da1772b8b0d52E4E1fcFd4AD";
    const ADDRESS_TO_GRANT = "0x371f0765550d085611e11b7399ae79cc7feb9b54";

    // Get contract instance
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const certificateNFT = CertificateNFT.attach(CERTIFICATE_NFT_ADDRESS);

    console.log("Contract address:", CERTIFICATE_NFT_ADDRESS);
    console.log("Granting roles to:", ADDRESS_TO_GRANT);
    console.log("");

    // Get role hashes
    const ADMIN_ROLE = await certificateNFT.ADMIN_ROLE();
    const MINTER_ROLE = await certificateNFT.MINTER_ROLE();
    const VERIFIER_ROLE = await certificateNFT.VERIFIER_ROLE();

    console.log("Role hashes:");
    console.log("ADMIN_ROLE:", ADMIN_ROLE);
    console.log("MINTER_ROLE:", MINTER_ROLE);
    console.log("VERIFIER_ROLE:", VERIFIER_ROLE);
    console.log("");

    // Check current roles
    const hasAdmin = await certificateNFT.hasRole(ADMIN_ROLE, ADDRESS_TO_GRANT);
    const hasMinter = await certificateNFT.hasRole(MINTER_ROLE, ADDRESS_TO_GRANT);
    const hasVerifier = await certificateNFT.hasRole(VERIFIER_ROLE, ADDRESS_TO_GRANT);

    console.log("Current roles for", ADDRESS_TO_GRANT);
    console.log("- ADMIN_ROLE:", hasAdmin);
    console.log("- MINTER_ROLE:", hasMinter);
    console.log("- VERIFIER_ROLE:", hasVerifier);
    console.log("");

    // Grant ADMIN_ROLE if not already granted
    if (!hasAdmin) {
        console.log("Granting ADMIN_ROLE...");
        const tx1 = await certificateNFT.grantRole(ADMIN_ROLE, ADDRESS_TO_GRANT);
        await tx1.wait();
        console.log("✓ ADMIN_ROLE granted! Tx:", tx1.hash);
    } else {
        console.log("✓ Already has ADMIN_ROLE");
    }

    // Grant MINTER_ROLE if not already granted
    if (!hasMinter) {
        console.log("Granting MINTER_ROLE...");
        const tx2 = await certificateNFT.grantRole(MINTER_ROLE, ADDRESS_TO_GRANT);
        await tx2.wait();
        console.log("✓ MINTER_ROLE granted! Tx:", tx2.hash);
    } else {
        console.log("✓ Already has MINTER_ROLE");
    }

    // Grant VERIFIER_ROLE as well (bonus)
    if (!hasVerifier) {
        console.log("Granting VERIFIER_ROLE...");
        const tx3 = await certificateNFT.grantRole(VERIFIER_ROLE, ADDRESS_TO_GRANT);
        await tx3.wait();
        console.log("✓ VERIFIER_ROLE granted! Tx:", tx3.hash);
    } else {
        console.log("✓ Already has VERIFIER_ROLE");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All roles granted successfully!");
    console.log("=".repeat(60));
    console.log("\nThe address now has:");
    console.log("- ADMIN_ROLE (full contract control)");
    console.log("- MINTER_ROLE (can mint certificates)");
    console.log("- VERIFIER_ROLE (can verify certificates)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
