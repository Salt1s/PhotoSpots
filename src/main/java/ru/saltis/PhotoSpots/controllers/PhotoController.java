package ru.saltis.photospots.controllers;

import static java.util.stream.Collectors.toList;

import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ru.saltis.photospots.dto.PhotoDataDto;
import ru.saltis.photospots.dto.PhotoDto;
import ru.saltis.photospots.models.Photo;
import ru.saltis.photospots.services.GeotagService;
import ru.saltis.photospots.services.PeopleService;
import ru.saltis.photospots.services.PhotoService;
import ru.saltis.photospots.util.PhotoErrorResponse;
import ru.saltis.photospots.util.PhotoNotFoundException;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {
    private static final Logger log = LoggerFactory.getLogger(PhotoController.class);
    private static final Path PHOTO_UPLOAD_DIR =
            Paths.get("src/main/resources/static/uploads/photos").toAbsolutePath().normalize();
    private static final long MAX_INLINE_PHOTO_SIZE_BYTES = 5L * 1024L * 1024L;

    private final PhotoService photoService;
    private final GeotagService geotagService;
    private final ModelMapper modelMapper;
    private final PeopleService peopleService;

    @Autowired
    public PhotoController(PhotoService photoService,
                           GeotagService geotagService,
                           ModelMapper modelMapper,
                           PeopleService peopleService) {
        this.photoService = photoService;
        this.geotagService = geotagService;
        this.modelMapper = modelMapper;
        this.peopleService = peopleService;
    }

    // Добавьте этот метод в класс PhotoController
    @GetMapping("/data/{fileName}")
    public ResponseEntity<?> getPhotoData(@PathVariable String fileName) {
        try {
            Path filePath = PHOTO_UPLOAD_DIR.resolve(fileName).normalize();

            // Блокируем выход за пределы каталога загрузок
            if (!filePath.startsWith(PHOTO_UPLOAD_DIR)) {
                return ResponseEntity.badRequest().body("Некорректное имя файла");
            }

            // Проверяем существование файла
            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                return ResponseEntity.notFound().build();
            }

            if (Files.size(filePath) > MAX_INLINE_PHOTO_SIZE_BYTES) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                        .body("Файл слишком большой для inline-выдачи");
            }

            // Читаем файл и конвертируем в Base64
            byte[] fileContent = Files.readAllBytes(filePath);
            String base64Data = Base64.getEncoder().encodeToString(fileContent);

            // Возвращаем данные
            return ResponseEntity.ok(new PhotoDataDto(base64Data));

        } catch (IOException e) {
            log.error("Ошибка при чтении файла {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при чтении файла");
        }
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getPhotosPerson(@PathVariable("id") int id) {
        List<Photo> photos = photoService.findAllByPersonId(id);

        List<PhotoDto> photoDtos = photos.stream()
                .map(photo -> {
                    PhotoDto dto = new PhotoDto();
                    dto.setId(photo.getId());
                    dto.setUrl(photo.getUrl());
                    dto.setDescription(photo.getDescription());
                    dto.setUploadedAt(photo.getUploadedAt());
                    dto.setOwner(peopleService.converToPersonDto(photo.getOwner())); // Добавляем информацию о владельце
                    return dto;
                })
                .collect(toList());

        return ResponseEntity.ok(photoDtos);
    }

    @GetMapping("{geotagId}/all")
    public ResponseEntity<?> getPhotosByGeotag(@PathVariable int geotagId) {
        List<Photo> photos = photoService.findAllByGeotagId(geotagId);

        List<PhotoDto> photoDtos = photos.stream()
                .map(photo -> {
                    PhotoDto dto = new PhotoDto();
                    dto.setId(photo.getId());
                    dto.setUrl(photo.getUrl());
                    dto.setDescription(photo.getDescription());
                    dto.setUploadedAt(photo.getUploadedAt());
                    dto.setOwner(peopleService.converToPersonDto(photo.getOwner())); // Добавляем информацию о владельце
                    return dto;
                })
                .collect(toList());

        return ResponseEntity.ok(photoDtos);
    }

    @GetMapping("/{photoId}")
    public ResponseEntity<?> getPhoto(@PathVariable int photoId) {

        Photo photo = photoService.findById(photoId);
        if (photo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Фото не найдено");
        }

        // Преобразуем объект Photo в PhotoDto
        PhotoDto photoDto = new PhotoDto();
        photoDto.setUrl(photo.getUrl());
        photoDto.setDescription(photo.getDescription());
        photoDto.setUploadedAt(photo.getUploadedAt()); // Assuming 'createdAt' is the upload date

        return ResponseEntity.ok(photoDto);
    }

    @PostMapping(path = "/{geotagId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addPhoto(@PathVariable("geotagId") int geotagId,
                                      @RequestParam("files") List<MultipartFile> files) {
        try {
            if (files.isEmpty()) {
                return ResponseEntity.badRequest().body("Не выбраны файлы для загрузки");
            }

            List<PhotoDto> photoDtoList = new ArrayList<>();
            // Обрабатываем каждый файл
            for (MultipartFile file : files) {
                // Проверяем, пустой ли файл
                if (file.isEmpty()) {
                    continue;  // Пропускаем пустые файлы
                }

                // Получаем безопасное имя файла
                String uploadedName = file.getOriginalFilename();
                String originalFileName = uploadedName == null
                        ? "photo.bin"
                        : Paths.get(uploadedName).getFileName().toString();
                String fileName = UUID.randomUUID() + "_" + originalFileName;

                // Абсолютный путь для сохранения файлов
                if (!Files.exists(PHOTO_UPLOAD_DIR)) {
                    Files.createDirectories(PHOTO_UPLOAD_DIR);  // Создаем директорию, если не существует
                }

                // Путь к файлу для сохранения
                Path filePath = PHOTO_UPLOAD_DIR.resolve(fileName).normalize();
                file.transferTo(filePath.toFile());

                // URL для доступа к файлу
                String url = "/uploads/photos/" + fileName;

                // Создаем объект фото и привязываем к геометке
                Photo photo = new Photo();
                photo.setUrl(url);
                photo.setGeotag(geotagService.findOne(geotagId));
                photoService.save(photo);

                // Создаем DTO для фото и добавляем в список
                PhotoDto photoDto = new PhotoDto();
                photoDto.setUrl(url);
                photoDto.setDescription(photo.getDescription());
                photoDto.setUploadedAt(photo.getUploadedAt());
                photoDtoList.add(photoDto);
            }

            if (photoDtoList.isEmpty()) {
                return ResponseEntity.badRequest().body("Все переданные файлы оказались пустыми");
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(photoDtoList);

        } catch (IOException e) {
            log.error("Ошибка при сохранении фото для geotagId={}", geotagId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка при сохранении фото");
        }
    }

    // Редактирование фото
    @PatchMapping("/{geotagId}/{photoId}")
    public ResponseEntity<?> updatePhoto(@PathVariable("geotagId") int geotagId,
                                         @PathVariable("photoId") int photoId,
                                         @RequestBody @Valid PhotoDto photoDto,
                                         BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldErrors().stream()
                    .map(err -> err.getField() + " - " + err.getDefaultMessage())
                    .collect(Collectors.joining("; "));
            return ResponseEntity.badRequest().body(errorMsg);
        }

        Photo existingPhoto = photoService.findById(photoId);
        if (existingPhoto == null || existingPhoto.getGeotag().getId() != geotagId) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Photo not found for this Geotag");
        }

        existingPhoto.setUrl(photoDto.getUrl());
        existingPhoto.setDescription(photoDto.getDescription());
        photoService.update(photoId, existingPhoto);
        return ResponseEntity.ok().build();
    }

    // 🗑️ Удаление фото
    @DeleteMapping("/{photoId}")
    public ResponseEntity<?> deletePhoto(@PathVariable("photoId") int photoId) {
        Photo photo = photoService.findById(photoId);
        if (photo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Фото не найдено");
        }

        // Удаление файла с диска
        try {
            String fileName = Paths.get(photo.getUrl()).getFileName().toString();
            Path filePath = PHOTO_UPLOAD_DIR.resolve(fileName).normalize();
            if (!filePath.startsWith(PHOTO_UPLOAD_DIR)) {
                return ResponseEntity.badRequest().body("Некорректное имя файла");
            }
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Ошибка при удалении файла фото photoId={}", photoId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка при удалении файла");
        }

        // Удаление записи из БД
        photoService.delete(photoId);
        return ResponseEntity.ok("Фото удалено");
    }

    @ExceptionHandler(PhotoNotFoundException.class)
    private ResponseEntity<PhotoErrorResponse> handleException(
            PhotoNotFoundException exception) {
        PhotoErrorResponse response = new PhotoErrorResponse(
                "Photo with this ID not found", System.currentTimeMillis()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND); // 404
    }

}
