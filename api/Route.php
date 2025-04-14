<?php

#[Attribute(Attribute::TARGET_FUNCTION | Attribute::TARGET_METHOD)]
class Route
{
    public string $path;
    public string $method;

    public function __construct(string $path, string $method = 'GET')
    {
        $this->path = $path;
        $this->method = $method;
    }
}
