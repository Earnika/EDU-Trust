import { expect } from "chai";
import { ethers } from "hardhat";
import { CertificateNFT } from "../typechain-types";

describe("CertificateNFT Bulk Minting & Advanced Features", function () {
    let certificateNFT: CertificateNFT;
    let owner: any;
    let minter: any;
    let verifier: any;
    let student1: any;
    let student2: any;
    let otherAccount: any;

    beforeEach(async function () {
        [owner, minter, verifier, student1, student2, otherAccount] = await ethers.getSigners();

        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        certificateNFT = await CertificateNFT.deploy();
        await certificateNFT.waitForDeployment();

        // Grant MINTER_ROLE
        const MINTER_ROLE = await certificateNFT.MINTER_ROLE();
        await certificateNFT.grantRole(MINTER_ROLE, minter.address);

        // Grant VERIFIER_ROLE
        const VERIFIER_ROLE = await certificateNFT.VERIFIER_ROLE();
        await certificateNFT.grantRole(VERIFIER_ROLE, verifier.address);
    });

    describe("Bulk Minting", function () {
        it("Should allow minter to batch mint certificates", async function () {
            const students = [student1.address, student2.address];
            const courseNames = ["Course 1", "Course 2"];
            const grades = ["A", "B"];
            const ipfsHashes = ["QmHash1", "QmHash2"];

            await certificateNFT.connect(minter).mintCertificatesBatch(
                students,
                courseNames,
                grades,
                ipfsHashes
            );

            expect(await certificateNFT.balanceOf(student1.address)).to.equal(1);
            expect(await certificateNFT.balanceOf(student2.address)).to.equal(1);

            // Token ID 1 should belong to student1, 2 to student2 (since counter starts at 0, assumes incremented)
            // Check specific token ownership
            // Need to find out token IDs. They should be 1 and 2.
            expect(await certificateNFT.ownerOf(1)).to.equal(student1.address);
            expect(await certificateNFT.ownerOf(2)).to.equal(student2.address);
        });

        it("Should fail if array lengths mismatch", async function () {
            const students = [student1.address, student2.address];
            const courseNames = ["Course 1"]; // Short
            const grades = ["A", "B"];
            const ipfsHashes = ["QmHash1", "QmHash2"];

            await expect(
                certificateNFT.connect(minter).mintCertificatesBatch(students, courseNames, grades, ipfsHashes)
            ).to.be.revertedWith("Array length mismatch");
        });

        it("Should enforce MAX_BATCH_SIZE", async function () {
            const size = 51; // MAX is 50
            const students = new Array(size).fill(student1.address);
            const courseNames = new Array(size).fill("Course");
            const grades = new Array(size).fill("A");
            const ipfsHashes = students.map((_, i) => `QmBatchHash${i}`);

            await expect(
                certificateNFT.connect(minter).mintCertificatesBatch(students, courseNames, grades, ipfsHashes)
            ).to.be.revertedWith("Invalid batch size");
        });

        it("Should prevent non-minters from batch minting", async function () {
            const students = [student1.address];
            const courseNames = ["Course 1"];
            const grades = ["A"];
            const ipfsHashes = ["QmHash1"];

            // otherAccount does not have MINTER_ROLE
            await expect(
                certificateNFT.connect(otherAccount).mintCertificatesBatch(students, courseNames, grades, ipfsHashes)
            ).to.be.reverted; // AccessControl error
        });
    });

    describe("Achievement Certificates", function () {
        it("Should mint achievement certificate", async function () {
            const title = "Best Coder";
            const description = "Won the hackathon";
            const category = "Academic";
            const date = Math.floor(Date.now() / 1000);
            const verifiers = [verifier.address];
            const hash = "QmAchievement1";

            await certificateNFT.connect(minter).mintAchievementCertificate(
                student1.address,
                title,
                description,
                category,
                date,
                verifiers,
                hash
            );

            expect(await certificateNFT.balanceOf(student1.address)).to.equal(1);
            const tokenId = 1;

            const cert = await certificateNFT.getAchievementCertificate(tokenId);
            expect(cert.achievementTitle).to.equal(title);
            expect(cert.category).to.equal(category);
            expect(cert.verifiers[0]).to.equal(verifier.address);
        });
    });

    describe("Custom Certificates", function () {
        it("Should mint custom certificate", async function () {
            const templateId = "custom-v1";
            const fieldNames = ["Field1", "Field2"];
            const fieldValues = ["Value1", "Value2"];
            const hash = "QmCustom1";

            await certificateNFT.connect(minter).mintCustomCertificate(
                student1.address,
                templateId,
                fieldNames,
                fieldValues,
                hash
            );

            expect(await certificateNFT.balanceOf(student1.address)).to.equal(1);
            const tokenId = 1;

            const cert = await certificateNFT.getCustomCertificate(tokenId);
            expect(cert.templateId).to.equal(templateId);
            expect(cert.fieldNames[0]).to.equal("Field1");
            expect(cert.fieldValues[1]).to.equal("Value2");
        });
    });

    describe("Verifier Role", function () {
        it("Should allow VERIFIER_ROLE to verify certificates", async function () {
            // Mint a certificate first
            await certificateNFT.connect(minter).mintCertificate(
                student1.address,
                "Course 1",
                "A",
                "QmVerifyHash"
            );
            const tokenId = 1;

            // Verify as verifier
            const result = await certificateNFT.connect(verifier).verifyCertificateByVerifier(tokenId);
            // Returns (isValid, type)
            // Note: result is a transaction response if not view? 
            // verifyCertificateByVerifier is NOT view in my specific implementation? 
            // Wait, checking the solidity code...
            // "function verifyCertificateByVerifier(uint256 tokenId) external onlyRole(VERIFIER_ROLE) returns (bool isValid, CertificateType certType)"
            // It emits an event, so it's a state-changing function (not view), thus returns tx.
            // But we can call it with staticCall to get return values.

            const [isValid, certType] = await certificateNFT.connect(verifier).verifyCertificateByVerifier.staticCall(tokenId);
            expect(isValid).to.equal(true);
            expect(certType).to.equal(0); // Regular
        });
    });
});
