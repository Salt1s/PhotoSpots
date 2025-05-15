package ru.saltis.PhotoSpots.controllers;

import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.web.exchanges.HttpExchange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.saltis.PhotoSpots.dto.GeotagDTO;
import ru.saltis.PhotoSpots.dto.PhotoDTO;
import ru.saltis.PhotoSpots.dto.PhotoDataDTO;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.models.Photo;
import ru.saltis.PhotoSpots.services.GeotagService;
import ru.saltis.PhotoSpots.services.PeopleService;
import ru.saltis.PhotoSpots.services.PhotoService;
import ru.saltis.PhotoSpots.util.GeotagNotFoundException;
import ru.saltis.PhotoSpots.util.PersonErrorResponse;
import ru.saltis.PhotoSpots.util.PhotoNotFoundException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {
    private final PhotoService photoService;
    private final GeotagService geotagService;
    private final ModelMapper modelMapper;
    private final PeopleService peopleService;

    @Autowired
    public PhotoController(PhotoService photoService, GeotagService geotagService, ModelMapper modelMapper, PeopleService peopleService) {
        this.photoService = photoService;
        this.geotagService = geotagService;
        this.modelMapper = modelMapper;
        this.peopleService = peopleService;
    }

    // Добавьте этот метод в класс PhotoController
    @GetMapping("/data/{fileName}")
    public ResponseEntity<?> getPhotoData(@PathVariable String fileName) {
        try {
            // Путь к файлу
            Path filePath = Paths.get("src/main/resources/static/uploads/photos").resolve(fileName);

            // Проверяем существование файла
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            // Читаем файл и конвертируем в Base64
            byte[] fileContent = Files.readAllBytes(filePath);
            String base64Data = Base64.getEncoder().encodeToString(fileContent);

            // Возвращаем данные
            return ResponseEntity.ok(new PhotoDataDTO(base64Data));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при чтении файла");
        }
    }

    @GetMapping("/profile/{id}")
    public List<PhotoDTO> getPhotosPerson(@PathVariable("id") int id) {
        return photoService.findAllByPersonId(id).stream().map(this::convertToPhotoDTO).collect(Collectors.toList());
    }

    @GetMapping("{geotagId}/all")
    public ResponseEntity<?> getPhotosByGeotag(@PathVariable int geotagId) {
        List<Photo> photos = photoService.findAllByGeotagId(geotagId);

        List<PhotoDTO> photoDTOs = photos.stream()
                .map(photo -> {
                    PhotoDTO dto = new PhotoDTO();
                    dto.setId(photo.getId());
                    dto.setUrl(photo.getUrl());
                    dto.setDescription(photo.getDescription());
                    dto.setUploadedAt(photo.getUploadedAt());
                    dto.setOwner(peopleService.converToPersonDTO(photo.getOwner())); // Добавляем информацию о владельце
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(photoDTOs);
    }

//    @GetMapping("/{geotagId}")
//    public List<PhotoDTO> getPhotosGeotag(@PathVariable("geotagId") int id) {
//        return photoService.findAllByGeotagId(id).stream().map(this::convertToPhotoDTO).collect(Collectors.toList());
//    }

    @GetMapping("/{photoId}")
    public ResponseEntity<?> getPhoto(@PathVariable int photoId) {

        Photo photo = photoService.findById(photoId);
        if (photo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Фото не найдено");
        }

        // Преобразуем объект Photo в PhotoDTO
        PhotoDTO photoDTO = new PhotoDTO();
        photoDTO.setUrl(photo.getUrl());
        photoDTO.setDescription(photo.getDescription());
        photoDTO.setUploadedAt(photo.getUploadedAt()); // Assuming 'createdAt' is the upload date

        return ResponseEntity.ok(photoDTO);
    }



    @PostMapping(path = "/{geotagId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addPhoto(@PathVariable("geotagId") int geotagId,
                                      @RequestParam("files") List<MultipartFile> files) {
        try {
            if (files.isEmpty()) {
                return ResponseEntity.badRequest().body("Не выбраны файлы для загрузки");
            }

            List<PhotoDTO> photoDTOList = new ArrayList<>();
            // Обрабатываем каждый файл
            for (MultipartFile file : files) {
                // Проверяем, пустой ли файл
                if (file.isEmpty()) {
                    continue;  // Пропускаем пустые файлы
                }

                // Получаем безопасное имя файла
                String originalFileName = Paths.get(file.getOriginalFilename()).getFileName().toString();
                String fileName = UUID.randomUUID() + "_" + originalFileName;

                // Абсолютный путь для сохранения файлов
                Path uploadPath = Paths.get("src/main/resources/static/uploads/photos").toAbsolutePath();
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);  // Создаем директорию, если не существует
                }

                // Путь к файлу для сохранения
                Path filePath = uploadPath.resolve(fileName);
                file.transferTo(filePath.toFile());

                // URL для доступа к файлу
                String url = "/uploads/photos/" + fileName;

                // Создаем объект фото и привязываем к геометке
                Photo photo = new Photo();
                photo.setUrl(url);
                photo.setGeotag(geotagService.findOne(geotagId));
                photoService.save(photo);

                // Создаем DTO для фото и добавляем в список
                PhotoDTO photoDTO = new PhotoDTO();
                photoDTO.setUrl(url);
                photoDTO.setDescription(photo.getDescription());
                photoDTO.setUploadedAt(photo.getUploadedAt());
                photoDTOList.add(photoDTO);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body("фото успешно сохранено");

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка при сохранении фото");
        }
    }

// ✏️ Редактирование фото
@PatchMapping("/{photoId}")
public ResponseEntity<?> updatePhoto(@PathVariable("geotagId") int geotagId,
                                     @PathVariable("photoId") int photoId,
                                     @RequestBody @Valid PhotoDTO photoDTO,
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

    existingPhoto.setUrl(photoDTO.getUrl());
    existingPhoto.setDescription(photoDTO.getDescription());
    photoService.save(existingPhoto);
    return ResponseEntity.ok().build();
}

// 🗑️ Удаление фото
@DeleteMapping("/{photoId}")
public ResponseEntity<?> deletePhoto(@PathVariable("photoId") int photoId,
                                     HttpExchange.Principal principal) {
    Photo photo = photoService.findById(photoId);
    if (photo == null) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Фото не найдено");
    }

    // Получаем текущего пользователя
    String username = principal.getName();
    Person currentUser = peopleService.findByUsername(username);
    if (currentUser == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не найден");
    }

    // Проверка владельца
    if (photo.getOwner().getId() != currentUser.getId()) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Вы не владелец этого фото");
    }

    // Удаление файла с диска
    try {
        String fileName = Paths.get(photo.getUrl()).getFileName().toString();
        Path filePath = Paths.get("uploads/photos", fileName);
        Files.deleteIfExists(filePath);
    } catch (IOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка при удалении файла");
    }

    // Удаление записи из БД
    photoService.delete(photoId);
    return ResponseEntity.ok("Фото удалено");
}


    @ExceptionHandler(PhotoNotFoundException.class)
    private ResponseEntity<PersonErrorResponse> handleException(PhotoNotFoundException exception) {
        PersonErrorResponse response = new PersonErrorResponse(
                "Photo with this ID not found", System.currentTimeMillis()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND); //404
    }
//
//    @ExceptionHandler(PersonNotCreatedException.class)
//    private ResponseEntity<PersonErrorResponse> handleException(PersonNotCreatedException exception) {
//        PersonErrorResponse response = new PersonErrorResponse(
//                exception.getMessage(), System.currentTimeMillis()
//        );
//        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); //400
//    }

    private Photo convertToPhoto(PhotoDTO photoDTO) {
        return modelMapper.map(photoDTO, Photo.class);
    }

    private PhotoDTO convertToPhotoDTO(Photo photo) {
        return modelMapper.map(photo, PhotoDTO.class);
    }
}
