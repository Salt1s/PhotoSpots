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
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import ru.saltis.photospots.controllers.PhotoController;
import ru.saltis.photospots.dto.PhotoDataDto;
import ru.saltis.photospots.models.Person;
import ru.saltis.photospots.models.Photo;
import ru.saltis.photospots.repositories.PhotoRepository;
import ru.saltis.photospots.services.GeotagService;
import ru.saltis.photospots.services.PeopleService;
import ru.saltis.photospots.services.PhotoService;

@Tag("memory-stress")
@EnabledIfSystemProperty(named = "memory.stress.enabled", matches = "true")
@ExtendWith(MockitoExtension.class)
class MemoryStressTests {

    private static final Path UPLOAD_DIR = Paths.get("src/main/resources/static/uploads/photos");
    private static final String STRESS_FILE_NAME = "memory-stress-" + UUID.randomUUID() + ".bin";
    private static final Path STRESS_FILE = UPLOAD_DIR.resolve(STRESS_FILE_NAME);

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

    @InjectMocks
    private PhotoController photoController;

    @AfterAll
    static void cleanup() throws IOException {
        Files.deleteIfExists(STRESS_FILE);
        holdForProfiler();
    }

    @Test
    void memoryLoadRunsForConfiguredDuration() throws Exception {
        prepareStressFile(2 * 1024 * 1024);

        Duration duration = Duration.ofSeconds(Long.getLong("memory.stress.durationSeconds", 20L));
        Instant deadline = Instant.now().plus(duration);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("stress-user", "pwd"));

        Person owner = new Person();
        owner.setUsername("stress-user");
        when(peopleService.findOne("stress-user")).thenReturn(owner);

        int iterations = 0;
        long totalPayloadBytes = 0;
        while (Instant.now().isBefore(deadline)) {
            ResponseEntity<?> response = photoController.getPhotoData(STRESS_FILE_NAME);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertInstanceOf(PhotoDataDto.class, response.getBody());

            PhotoDataDto data = (PhotoDataDto) response.getBody();
            assertNotNull(data.getData());
            totalPayloadBytes += data.getData().length();

            Photo photo = new Photo();
            photo.setUrl("/uploads/photos/" + iterations + ".jpg");
            photo.setDescription("stress-" + iterations);
            photo.setUploadedAt(LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(10)));

            photoService.save(photo);

            iterations++;
            if (iterations % 10 == 0) {
                printMemorySnapshot("memory-load", iterations, totalPayloadBytes);
            }
        }

        printMemorySnapshot("memory-load-final", iterations, totalPayloadBytes);
        SecurityContextHolder.clearContext();
    }

    private static void prepareStressFile(int sizeInBytes) throws IOException {
        Files.createDirectories(UPLOAD_DIR);
        byte[] payload = new byte[sizeInBytes];
        ThreadLocalRandom.current().nextBytes(payload);
        Files.write(STRESS_FILE, payload);
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

        long holdMillis = Long.getLong("memory.stress.holdMillis", 3000L);
        System.out.printf("[memory-load-finalize] holding JVM alive for %d ms%n", holdMillis);
        try {
            Thread.sleep(holdMillis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}