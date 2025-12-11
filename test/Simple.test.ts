import { expect } from "chai";
import { ethers } from "hardhat";

describe("Simple Deployment Debug", function () {
    it("Should deploy certificate contract", async function () {
        console.log("Starting deployment...");
        const [owner] = await ethers.getSigners();
        console.log("Owner:", owner.address);

        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        console.log("Factory created");

        // estimate gas for deployment
        const deploymentData = await CertificateNFT.getDeployTransaction();
        const gasEstimate = await owner.estimateGas(deploymentData);
        console.log("Gas estimate for deployment:", gasEstimate.toString());

        const certificateNFT = await CertificateNFT.deploy();
        console.log("Deploy tx sent");

        await certificateNFT.waitForDeployment();
        console.log("Deployed at:", await certificateNFT.getAddress());
    });
});
