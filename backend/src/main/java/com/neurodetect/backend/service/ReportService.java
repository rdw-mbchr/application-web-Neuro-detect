package com.neurodetect.backend.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.neurodetect.backend.dto.ReportDTO;
import com.neurodetect.backend.entity.Analysis;
import com.neurodetect.backend.entity.Patient;
import com.neurodetect.backend.entity.Report;
import com.neurodetect.backend.entity.User;
import com.neurodetect.backend.exception.ApiException;
import com.neurodetect.backend.repository.AnalysisRepository;
import com.neurodetect.backend.repository.ReportRepository;
import com.neurodetect.backend.repository.UserRepository;
import com.neurodetect.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final DateTimeFormatter DATE_FMT     = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Transactional
    public ReportDTO generateReport(Long analysisId, UserPrincipal principal) {
        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Analysis not found"));
        User doctor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Patient  patient      = analysis.getPatient();
        int      reportNumber = (int) reportRepository.countByAnalysis_Patient_Id(patient.getId()) + 1;
        String   fileName     = buildFileName(patient, reportNumber);

        byte[] pdfBytes = buildPdf(analysis, doctor);
        String pdfPath  = savePdf(fileName, pdfBytes);

        Report report = Report.builder()
                .analysis(analysis)
                .generatedBy(doctor)
                .pdfPath(pdfPath)
                .reportNumber(reportNumber)
                .fileName(fileName)
                .build();

        return toDTO(reportRepository.save(report));
    }

    public ReportDTO getReport(Long reportId) {
        return toDTO(reportRepository.findById(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Report not found")));
    }

    public byte[] downloadReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Report not found"));
        try {
            return Files.readAllBytes(Paths.get(report.getPdfPath()));
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read PDF file");
        }
    }

    public List<ReportDTO> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private byte[] buildPdf(Analysis analysis, User doctor) {
        Patient patient = analysis.getPatient();
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 50, 50, 60, 60);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font titleFont      = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, BaseColor.BLACK);
            Font subtitleFont   = FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.DARK_GRAY);
            Font sectionFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
            Font labelFont      = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.GRAY);
            Font valueFont      = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
            Font smallFont      = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.GRAY);
            Font disclaimerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, new BaseColor(100, 100, 100));

            // Header
            Paragraph title = new Paragraph("NeuroDetect", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);

            Paragraph subtitle = new Paragraph("Rapport d'analyse IRM cérébrale", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(4);
            doc.add(subtitle);

            // Separator
            PdfPTable sep = new PdfPTable(1);
            sep.setWidthPercentage(100);
            PdfPCell sepCell = new PdfPCell(new Phrase(" "));
            sepCell.setBorderWidthTop(1.5f);
            sepCell.setBorderColorTop(BaseColor.BLACK);
            sepCell.setBorderWidthBottom(0);
            sepCell.setBorderWidthLeft(0);
            sepCell.setBorderWidthRight(0);
            sepCell.setPaddingBottom(12);
            sep.addCell(sepCell);
            doc.add(sep);

            // Patient info
            doc.add(new Paragraph("Informations patient", sectionFont));
            doc.add(Chunk.NEWLINE);
            PdfPTable patientTable = new PdfPTable(new float[]{2, 3});
            patientTable.setWidthPercentage(100);
            patientTable.setSpacingAfter(16);
            addRow(patientTable, "Nom complet",       patient.getLastName() + " " + patient.getFirstName(), labelFont, valueFont);
            addRow(patientTable, "CIN",               nvl(patient.getCin()),    labelFont, valueFont);
            addRow(patientTable, "Date de naissance", patient.getDateOfBirth() != null ? patient.getDateOfBirth().format(DATE_FMT) : "—", labelFont, valueFont);
            addRow(patientTable, "Genre",             nvl(patient.getGender()), labelFont, valueFont);
            doc.add(patientTable);

            // Analysis results
            doc.add(new Paragraph("Résultats de l'analyse", sectionFont));
            doc.add(Chunk.NEWLINE);
            PdfPTable analysisTable = new PdfPTable(new float[]{2, 3});
            analysisTable.setWidthPercentage(100);
            analysisTable.setSpacingAfter(16);
            addRow(analysisTable, "Date d'analyse", analysis.getAnalyzedAt() != null ? analysis.getAnalyzedAt().format(DATETIME_FMT) : "—", labelFont, valueFont);
            addRow(analysisTable, "Réalisé par",    analysis.getPerformedBy() != null ? analysis.getPerformedBy().getFullName() : "—", labelFont, valueFont);
            addRow(analysisTable, "Diagnostic",     nvl(analysis.getDiagnosis()), labelFont, valueFont);
            String confStr = analysis.getConfidence() != null
                    ? String.format("%.1f%%", analysis.getConfidence().multiply(BigDecimal.valueOf(100)))
                    : "—";
            addRow(analysisTable, "Confiance", confStr, labelFont, valueFont);
            doc.add(analysisTable);

            // Scores distribution
            Map<String, Double> scores = analysis.getAllScores();
            if (scores != null && !scores.isEmpty()) {
                doc.add(new Paragraph("Distribution des scores", sectionFont));
                doc.add(Chunk.NEWLINE);
                PdfPTable scoresTable = new PdfPTable(new float[]{2, 3});
                scoresTable.setWidthPercentage(100);
                scoresTable.setSpacingAfter(20);
                for (Map.Entry<String, Double> e : scores.entrySet()) {
                    addRow(scoresTable, e.getKey(), String.format("%.1f%%", e.getValue() * 100), labelFont, valueFont);
                }
                doc.add(scoresTable);
            }

            // Disclaimer box
            Paragraph disclaimer = new Paragraph(
                    "AVERTISSEMENT : Ce rapport est généré automatiquement par un système d'intelligence artificielle " +
                    "et constitue uniquement une aide au diagnostic. Il ne remplace en aucun cas l'avis d'un médecin qualifié. " +
                    "Un avis médical est requis pour tout diagnostic ou décision thérapeutique.",
                    disclaimerFont);
            disclaimer.setAlignment(Element.ALIGN_JUSTIFIED);

            PdfPTable disclaimerBox = new PdfPTable(1);
            disclaimerBox.setWidthPercentage(100);
            disclaimerBox.setSpacingBefore(8);
            PdfPCell dCell = new PdfPCell();
            dCell.setBorderColor(new BaseColor(180, 180, 180));
            dCell.setBackgroundColor(new BaseColor(248, 248, 248));
            dCell.setPadding(10);
            dCell.addElement(disclaimer);
            disclaimerBox.addCell(dCell);
            doc.add(disclaimerBox);

            // Footer
            doc.add(Chunk.NEWLINE);
            String footerDate = analysis.getAnalyzedAt() != null
                    ? analysis.getAnalyzedAt().format(DATETIME_FMT) : "—";
            Paragraph footer = new Paragraph(
                    "Rapport généré le " + footerDate + " par " + doctor.getFullName() + " via NeuroDetect",
                    smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return baos.toByteArray();
        } catch (DocumentException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate PDF: " + e.getMessage());
        }
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, labelFont));
        l.setBorder(Rectangle.NO_BORDER);
        l.setPaddingBottom(6);
        table.addCell(l);

        PdfPCell v = new PdfPCell(new Phrase(value, valueFont));
        v.setBorder(Rectangle.NO_BORDER);
        v.setPaddingBottom(6);
        table.addCell(v);
    }

    private String savePdf(String fileName, byte[] bytes) {
        try {
            Path dir = Paths.get(uploadDir, "reports");
            Files.createDirectories(dir);
            Path dest = dir.resolve(fileName);
            Files.write(dest, bytes);
            return dest.toString();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save PDF report");
        }
    }

    private static String buildFileName(Patient patient, int number) {
        String last  = normalize(patient.getLastName());
        String first = normalize(patient.getFirstName());
        return "rapport_" + last + "_" + first + "_" + number + ".pdf";
    }

    private static String normalize(String s) {
        if (s == null) return "patient";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_+|_+$", "");
    }

    private ReportDTO toDTO(Report r) {
        Analysis a        = r.getAnalysis();
        Patient  p        = a.getPatient();
        String   fileName = r.getFileName() != null
                ? r.getFileName()
                : "rapport_" + r.getId() + ".pdf";
        return ReportDTO.builder()
                .id(r.getId())
                .analysisId(a.getId())
                .patientId(p.getId())
                .patientName(p.getLastName() + " " + p.getFirstName())
                .patientCin(p.getCin())
                .diagnosis(a.getDiagnosis())
                .generatedByName(r.getGeneratedBy().getFullName())
                .reportNumber(r.getReportNumber())
                .fileName(fileName)
                .createdAt(r.getCreatedAt())
                .build();
    }

    private String nvl(String s) {
        return s != null ? s : "—";
    }
}
