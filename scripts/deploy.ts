import hre from "hardhat";
import fs from "fs";
// @ts-ignore - Hardhat runtime environment ethers access
const ethers = hre.ethers;

async function main() {
  console.log("Starting deployment of Vignan Institute Blockchain Certificate Platform...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy VignanRegistry first
  console.log("\n1. Deploying VignanRegistry...");
  const VignanRegistry = await ethers.getContractFactory("VignanRegistry");
  const vignanRegistry = await VignanRegistry.deploy();
  await vignanRegistry.waitForDeployment();
  console.log("VignanRegistry deployed to:", await vignanRegistry.getAddress());

  // Deploy CertificateNFT
  console.log("\n2. Deploying CertificateNFT...");
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.deploy();
  await certificateNFT.waitForDeployment();
  console.log("CertificateNFT deployed to:", await certificateNFT.getAddress());

  // ScholarshipEscrow deployment REMOVED as per request

  // Set up roles and permissions
  console.log("\n3. Setting up roles and permissions...");

  // Grant MINTER_ROLE to deployer for CertificateNFT
  const MINTER_ROLE = await certificateNFT.MINTER_ROLE();
  await certificateNFT.grantRole(MINTER_ROLE, deployer.address);
  console.log("Granted MINTER_ROLE to deployer");

  // Set base URI for CertificateNFT
  const baseURI = "https://api.vignan.edu/certificates/metadata/";
  await certificateNFT.setBaseURI(baseURI);
  console.log("Set base URI for CertificateNFT:", baseURI);

  // Use deployer as test student (real address that can claim scholarships)
  console.log("\n4. Setting up test student...");
  const testStudent = deployer.address;
  console.log("Test student address:", testStudent);

  // Mint 3 sample certificates
  console.log("\n5. Minting sample certificates...");

  try {
    const certificate1 = await certificateNFT.mintCertificate(
      testStudent,
      "Computer Science Fundamentals",
      "A+",
      "QmSampleHash1"
    );
    await certificate1.wait();
    console.log("Minted certificate 1, Token ID: 1");

    const certificate2 = await certificateNFT.mintCertificate(
      testStudent,
      "Data Structures and Algorithms",
      "A",
      "QmSampleHash2"
    );
    await certificate2.wait();
    console.log("Minted certificate 2, Token ID: 2");

    const certificate3 = await certificateNFT.mintCertificate(
      testStudent,
      "Electrical Engineering Basics",
      "B+",
      "QmSampleHash3"
    );
    await certificate3.wait();
    console.log("Minted certificate 3, Token ID: 3");

  } catch (error) {
    console.error("Error minting certificates:", error);
    throw error;
  }

  // Scholarship creation REMOVED

  // Verify certificates
  console.log("\n6. Verifying certificates...");
  // verifyCertificate now returns (isValid, uri, certType)
  const [cert1Valid, cert1Uri, cert1Type] = await certificateNFT.verifyCertificate(1);
  console.log("Certificate 1 valid:", cert1Valid);
  console.log("Certificate 1 URI:", cert1Uri);

  // Display deployment summary
  console.log("\n" + "=".repeat(80));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(80));
  const deploymentNetwork = await ethers.provider.getNetwork();
  console.log("Network:", deploymentNetwork.name);
  console.log("Chain ID:", deploymentNetwork.chainId);
  console.log("Deployer:", deployer.address);
  console.log("VignanRegistry:", await vignanRegistry.getAddress());
  console.log("CertificateNFT:", await certificateNFT.getAddress());
  // console.log("ScholarshipEscrow:", await scholarshipEscrow.getAddress());

  const contractAddresses = {
    network: deploymentNetwork.name,
    chainId: deploymentNetwork.chainId,
    contracts: {
      VignanRegistry: await vignanRegistry.getAddress(),
      CertificateNFT: await certificateNFT.getAddress(),
      // ScholarshipEscrow: await scholarshipEscrow.getAddress()
    },
    deployer: deployer.address,
    testStudent: testStudent,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    'deployment-addresses.json',
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("\nContract addresses saved to deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
