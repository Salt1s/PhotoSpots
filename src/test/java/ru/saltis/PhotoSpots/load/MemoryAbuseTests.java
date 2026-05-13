package ru.saltis.photospots.load;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import ru.saltis.photospots.controllers.PhotoController;
import ru.saltis.photospots.dto.PhotoDataDto;
import ru.saltis.photospots.models.Geotag;
import ru.saltis.photospots.models.Person;
import ru.saltis.photospots.models.Photo;
import ru.saltis.photospots.repositories.PhotoRepository;
import ru.saltis.photospots.services.GeotagService;
import ru.saltis.photospots.services.PeopleService;
import ru.saltis.photospots.services.PhotoService;
import org.springframework.web.multipart.MultipartFile;

@Tag("memory-abuse")
@EnabledIfSystemProperty(named = "memory.abuse.enabled", matches = "true")
@ExtendWith(MockitoExtension.class)
class MemoryAbuseTests {

    private static final Path UPLOAD_DIR = Paths.get("src/main/resources/static/uploads/photos");
    private static final String STRESS_FILE_NAME = "memory-abuse-" + UUID.randomUUID() + ".bin";
    private static final Path STRESS_FILE = UPLOAD_DIR.resolve(STRESS_FILE_NAME);
    private static final String USERNAME = "abuse-user";

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private PeopleService peopleService;

    @Mock
    private GeotagService geotagService;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private PhotoService photoService;

    private PhotoController photoController;

    @BeforeEach
    void setUpController() {
        photoController = new PhotoController(photoService, geotagService, modelMapper, peopleService);
    }

    @AfterAll
    static void cleanup() throws IOException {
        Files.deleteIfExists(STRESS_FILE);
        if (Files.exists(UPLOAD_DIR)) {
            try (var files = Files.list(UPLOAD_DIR)) {
                files.filter(path -> path.getFileName().toString().contains("memory-abuse-")
                                || path.getFileName().toString().contains("memory-stress-"))
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException ignored) {
                                // best effort cleanup for profiler runs
                            }
                        });
            }
        }
        holdForProfiler();
    }

    @Test
    void abusiveActionsConsumeMemoryForConfiguredDuration() throws Exception {
        prepareStressFile(3 * 1024 * 1024);
        configureSecurity();
        configureMocks();

        Duration duration = Duration.ofSeconds(Long.getLong("memory.abuse.durationSeconds", 20L));
        Instant deadline = Instant.now().plus(duration);
        int iterations = 0;
        long totalAllocatedBytes = 0;

        while (Instant.now().isBefore(deadline)) {
            ResponseEntity<?> readResponse = photoController.getPhotoData(STRESS_FILE_NAME);
            assertEquals(HttpStatus.OK, readResponse.getStatusCode());
            assertInstanceOf(PhotoDataDto.class, readResponse.getBody());

            PhotoDataDto data = (PhotoDataDto) readResponse.getBody();
            assertNotNull(data.getData());
            totalAllocatedBytes += data.getData().length();

            List<MultipartFile> files = new ArrayList<>();
            for (int i = 0; i < 3; i++) {
                files.add(new MockMultipartFile(
                        "files",
                        buildAbuseFileName(iterations, i),
                        MediaType.APPLICATION_OCTET_STREAM_VALUE,
                        buildPayload(512 * 1024)
                ));
            }

            ResponseEntity<?> uploadResponse = photoController.addPhoto(1, files);
            assertEquals(HttpStatus.CREATED, uploadResponse.getStatusCode());

            Photo photo = new Photo();
            photo.setUrl("/uploads/photos/abuse-" + iterations + ".jpg");
            photo.setDescription(generateLongDescription(iterations));
            photo.setUploadedAt(LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(30)));
            photoService.save(photo);

            iterations++;
            if (iterations % 5 == 0) {
                printMemorySnapshot("memory-abuse", iterations, totalAllocatedBytes);
            }
        }

        printMemorySnapshot("memory-abuse-final", iterations, totalAllocatedBytes);
        SecurityContextHolder.clearContext();
    }

    private void configureSecurity() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(USERNAME, "pwd"));
    }

    private void configureMocks() {
        Person owner = new Person();
        owner.setUsername(USERNAME);
        when(peopleService.findOne(USERNAME)).thenReturn(owner);

        Geotag geotag = new Geotag();
        geotag.setId(1);
        when(geotagService.findOne(1)).thenReturn(geotag);
    }

    private static void prepareStressFile(int sizeInBytes) throws IOException {
        Files.createDirectories(UPLOAD_DIR);
        byte[] payload = new byte[sizeInBytes];
        ThreadLocalRandom.current().nextBytes(payload);
        Files.write(STRESS_FILE, payload);
    }

    private static byte[] buildPayload(int sizeInBytes) {
        byte[] payload = new byte[sizeInBytes];
        ThreadLocalRandom.current().nextBytes(payload);
        return payload;
    }

    private static String buildAbuseFileName(int iteration, int fileIndex) {
        return "../../memory-abuse-" + iteration + "-" + fileIndex + "-" + UUID.randomUUID() + ".jpg";
    }

    private static String generateLongDescription(int iteration) {
        return "memory-abuse-description-" + iteration + "-" + "x".repeat(500);
    }

    private static void printMemorySnapshot(String label, int iteration, long payloadSize) {
        Runtime runtime = Runtime.getRuntime();
        long usedMb = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
        long totalMb = runtime.totalMemory() / (1024 * 1024);
        long maxMb = runtime.maxMemory() / (1024 * 1024);
        System.out.printf("[%s] iteration=%d payload=%d used=%dMB total=%dMB max=%dMB%n",
                label, iteration, payloadSize, usedMb, totalMb, maxMb);
    }

    private static void holdForProfiler() {
        System.gc();
        System.runFinalization();

        long holdMillis = Long.getLong("memory.abuse.holdMillis", 3000L);
        System.out.printf("[memory-abuse-finalize] holding JVM alive for %d ms%n", holdMillis);
        try {
            Thread.sleep(holdMillis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
