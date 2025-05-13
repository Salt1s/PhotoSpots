package ru.saltis.PhotoSpots.controllers;

import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.saltis.PhotoSpots.dto.GeotagDTO;
import ru.saltis.PhotoSpots.dto.PhotoDTO;
import ru.saltis.PhotoSpots.models.Geotag;
import ru.saltis.PhotoSpots.models.Person;
import ru.saltis.PhotoSpots.models.Photo;
import ru.saltis.PhotoSpots.services.GeotagService;
import ru.saltis.PhotoSpots.services.PeopleService;
import ru.saltis.PhotoSpots.services.PhotoService;
import ru.saltis.PhotoSpots.util.GeotagNotFoundException;
import ru.saltis.PhotoSpots.util.PersonErrorResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/map")
public class GeotagController {
    private final GeotagService geotagService;
    private final ModelMapper modelMapper;
    private final PeopleService peopleService;
    private final PhotoService photoService;
    private final ApplicationContext applicationContext;

    public GeotagController(GeotagService geotagService, ModelMapper modelMapper, PeopleService peopleService, PhotoService photoService, ApplicationContext applicationContext) {
        this.geotagService = geotagService;
        this.modelMapper = modelMapper;
        this.peopleService = peopleService;
        this.photoService = photoService;
        this.applicationContext = applicationContext;
    }

    @GetMapping()
    public List<GeotagDTO> getGeotags() {
        return geotagService.findAll().stream().map(this::converToGeotagDTO).collect(Collectors.toList()); //здесь автоматически Jackson конвертирует обьекты в JSON
    }

    @GetMapping("/profile/{id}")
    public List<GeotagDTO> getGeotagsPerson(@PathVariable("id") int id) {
        return geotagService.findAllByPersonId(id).stream().map(this::converToGeotagDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public GeotagDTO getGeotag(@PathVariable("id") int id) {
        return converToGeotagDTO(geotagService.findOne(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(@ModelAttribute @Valid GeotagDTO geotagDTO, @RequestParam("files") List<MultipartFile> files) {
        try {
            if (files.isEmpty()) {
                return ResponseEntity.badRequest().body("Не выбраны файлы для загрузки");
            }

            // Преобразуем DTO в модель геометки
            Geotag geotag = converToGeotag(geotagDTO);
            geotagService.save(geotag);

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
                photo.setGeotag(geotag);
                photoService.save(photo);

                // Создаем DTO для фото и добавляем в список
                PhotoDTO photoDTO = new PhotoDTO();
                photoDTO.setUrl(url);
                photoDTO.setDescription(photo.getDescription());
                photoDTO.setUploadedAt(photo.getUploadedAt());
                photoDTOList.add(photoDTO);
            }

            // Возвращаем список сохраненных фото с привязанной геометкой
            return ResponseEntity.status(HttpStatus.CREATED).body(photoDTOList);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка при сохранении фото");
        }
    }



    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id,
                                    @RequestBody @Valid GeotagDTO geotagDTO,
                                    BindingResult bindingResult) {
        // Проверка на ошибки валидации
        if (bindingResult.hasErrors()) {
            StringBuilder errorMSG = new StringBuilder();
            List<FieldError> errors = bindingResult.getFieldErrors();
            // Собираем ошибки и возвращаем их
            for (FieldError error : errors) {
                errorMSG.append(error.getField()).append(" - ").append(error.getDefaultMessage()).append("; ").append("\n");
            }
            // Возвращаем ошибки с кодом 400 Bad Request
            return ResponseEntity.badRequest().body(errorMSG.toString());
        }
        Geotag geotagOld = geotagService.findOne(id);
        // Преобразуем DTO в сущность
        Geotag geotag = converToGeotag(geotagDTO);
        geotag.setCreatedAt(geotagOld.getCreatedAt());
        geotag.setRating(geotagOld.getRating());
        geotag.setOwner(geotagOld.getOwner());
        geotagService.update(id, geotag);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        geotagService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }


    @ExceptionHandler(GeotagNotFoundException.class)
    private ResponseEntity<PersonErrorResponse> handleException(GeotagNotFoundException exception) {
        PersonErrorResponse response = new PersonErrorResponse(
                "Geotag with this ID not found", System.currentTimeMillis()
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

    private Geotag converToGeotag(GeotagDTO geotagDTO) {
        return modelMapper.map(geotagDTO, Geotag.class);
    }

    private GeotagDTO converToGeotagDTO(Geotag geotag) {
        return modelMapper.map(geotag, GeotagDTO.class);
    }
}
