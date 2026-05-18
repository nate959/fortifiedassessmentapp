import { jsPDF } from 'jspdf';

export const generatePDF = async (formData, defaultQuestions, profile = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const pageWidth = 8.5;
  const pageHeight = 11;
  let cursorY = 0.5;

  // Helper to add text
  const addText = (text, size, isBold, x, y, align = 'left', color = [0, 0, 0], maxWidth = 0) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    if (maxWidth > 0) {
      doc.text(text, x, y, { align, maxWidth });
    } else {
      doc.text(text, x, y, { align });
    }
  };

  const checkPageBreak = (neededSpace) => {
    if (cursorY + neededSpace > pageHeight - 0.5) {
      doc.addPage();
      cursorY = 1.0;
      return true;
    }
    return false;
  };

  // Company Profile Header
  if (profile.companyName || profile.logoUrl) {
    if (profile.logoUrl) {
      try {
        doc.addImage(profile.logoUrl, 'PNG', 0.5, cursorY, 1.5, 0.75, undefined, 'FAST');
      } catch (e) {
        console.error("Failed to add logo", e);
      }
    }
    
    // Right aligned contact info
    const rightX = pageWidth - 0.5;
    if (profile.companyName) {
      addText(profile.companyName, 14, true, rightX, cursorY + 0.2, 'right');
    }
    if (profile.phone || profile.email) {
      addText(`${profile.phone || ''}  ${profile.email || ''}`, 10, false, rightX, cursorY + 0.4, 'right');
    }
    if (profile.address) {
      addText(profile.address, 10, false, rightX, cursorY + 0.6, 'right');
    }
    
    // Add a divider line
    cursorY += 0.9;
    doc.setDrawColor(200, 200, 200);
    doc.line(0.5, cursorY, pageWidth - 0.5, cursorY);
    cursorY += 0.3;
  }

  // Header
  addText("SAH Initial Assessment", 18, true, pageWidth / 2, cursorY, 'center');
  cursorY += 0.5;

  // Status Banner
  const isPass = formData.status === 'PASS';
  doc.setFillColor(isPass ? 34 : 220, isPass ? 197 : 38, isPass ? 94 : 38);
  doc.rect(0.5, cursorY, 7.5, 0.4, 'F');
  addText(isPass ? "MEETS MINIMUM REQUIREMENTS" : "RETROFIT REQUIRED", 14, true, pageWidth / 2, cursorY + 0.28, 'center', [255, 255, 255]);
  cursorY += 0.8;

  // Client Details
  addText("Assessment Details", 14, true, 0.5, cursorY);
  cursorY += 0.3;
  addText(`SAH ID: ${formData.sahId || 'N/A'}`, 11, true, 0.5, cursorY);
  cursorY += 0.25;
  addText(`Client: ${formData.clientName || 'N/A'}`, 11, false, 0.5, cursorY);
  addText(`Evaluator: ${formData.evaluator || 'N/A'}`, 11, false, 4.25, cursorY);
  cursorY += 0.25;
  addText(`Property: ${formData.address || 'N/A'}`, 11, false, 0.5, cursorY);
  addText(`Date: ${formData.date || 'N/A'}`, 11, false, 4.25, cursorY);
  cursorY += 0.5;

  // Roofer Upgrade List Page
  if (formData.upgrades && formData.upgrades.length > 0) {
    checkPageBreak(2.0);
    addText("Required Retrofits / Upgrades", 14, true, 0.5, cursorY);
    cursorY += 0.3;
    formData.upgrades.forEach((upgrade, index) => {
      addText(`- ${upgrade}`, 12, false, 0.7, cursorY);
      cursorY += 0.25;
    });
    cursorY += 0.5;
  }

  // Checklist
  addText("Eligibility & Checklist", 14, true, 0.5, cursorY);
  cursorY += 0.3;

  defaultQuestions.forEach((section) => {
    checkPageBreak(0.6);
    addText(section.title, 12, true, 0.5, cursorY);
    cursorY += 0.3;

    section.questions.forEach((q, index) => {
      checkPageBreak(0.4);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const answer = formData.questions[q.id] || 'Not Answered';
      
      // Split long questions
      const lines = doc.splitTextToSize(`${index + 1}. ${q.text}`, 5.0);
      doc.text(lines, 0.5, cursorY);
      
      // Render answer
      doc.setFont("helvetica", "bold");
      if(answer === 'Yes' || answer === 'Slab-on-grade') doc.setTextColor(34, 197, 94);
      else if(answer === 'No' || answer === '3/8' || answer === 'Greater than 24"') doc.setTextColor(220, 38, 38);
      else doc.setTextColor(100, 116, 139);
      
      doc.text(`[ ${answer} ]`, 6.0, cursorY);
      doc.setTextColor(0,0,0);
      
      cursorY += (lines.length * 0.15) + 0.1;

      // Check for specific photos for this question
      const qPhotos = (formData.photos || []).filter(p => p.questionId === q.id);
      if (qPhotos.length > 0) {
        cursorY += 0.1;
        const photoW = 2.0;
        const photoH = 1.5;
        let photoX = 0.8;
        
        qPhotos.forEach((p, i) => {
          if (photoX + photoW > 8.0) {
             photoX = 0.8;
             cursorY += photoH + 0.1;
          }
          checkPageBreak(photoH + 0.2);
          try {
            doc.addImage(p.dataUrl, 'JPEG', photoX, cursorY, photoW, photoH);
          } catch(e) {}
          photoX += photoW + 0.2;
        });
        cursorY += photoH + 0.2;
      } else {
        cursorY += 0.1;
      }
    });
    cursorY += 0.2;
  });

  cursorY += 0.3;

  // General Photos
  const generalPhotos = (formData.photos || []).filter(p => p.questionId === 'general');
  if (generalPhotos.length > 0) {
    checkPageBreak(1.0);
    
    addText("General Elevation & Property Photos", 14, true, 0.5, cursorY);
    cursorY += 0.3;

    // Grid layout for general photos: 2 per row
    let photoX = 0.5;
    const photoW = 3.5;
    const photoH = 2.5;

    for (let i = 0; i < generalPhotos.length; i++) {
      const p = generalPhotos[i];
      if (cursorY + photoH > pageHeight - 0.5) {
        doc.addPage();
        cursorY = 1.0;
        photoX = 0.5;
      }

      // Add image
      try {
        doc.addImage(p.dataUrl, 'JPEG', photoX, cursorY, photoW, photoH);
      } catch(e) {
        console.error("Error adding image to PDF:", e);
      }

      // Alternate position
      if (photoX === 0.5) {
        photoX = 4.25;
      } else {
        photoX = 0.5;
        cursorY += photoH + 0.3;
      }
    }
  }

  // Save the PDF
  const filename = `${formData.clientName || 'Assessment'}_${formData.date}.pdf`;
  doc.save(filename.replace(/\s+/g, '_'));
};
