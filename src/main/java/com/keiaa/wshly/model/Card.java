package com.keiaa.wshly.model;

import com.keiaa.wshly.model.enums.MainMessage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record Card(
    @NotBlank
    @Size(max = 10)
    String senderName,
    
    @NotBlank
    @Size(max = 10)
    String recipientName,
    
    MainMessage mainMessage,
    
    @Size(max = 150)
    String customMessage
) {}
